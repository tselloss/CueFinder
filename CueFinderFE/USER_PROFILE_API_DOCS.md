# User Profile API Documentation

## Overview

The User Profile system provides endpoints and methods for managing user profile information including personal details and posted cues.

## API Methods

### Authentication Service (`authService.js`)

#### `updateUserProfile(userId, profileData)`
Updates a user's profile information.

**Parameters:**
```javascript
userId: number              // ID of the user to update
profileData: object         // Profile data to update
  - name?: string          // Full name
  - email?: string         // Email address
  - phone?: string         // Phone number
  - location?: string      // General location (City, State)
  - address?: object       // Address details
    - street?: string      // Street address
    - city?: string        // City
    - state?: string       // State/Province
    - postalCode?: string  // Postal/ZIP code
    - country?: string     // Country
```

**Returns:**
```javascript
Promise<{
  success: boolean,
  user: object             // Updated user object
}>
```

**Example:**
```javascript
await authService.updateUserProfile(1, {
  phone: "+1 (555) 123-4567",
  location: "New York, NY",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA"
  }
});
```

**Error Handling:**
- Throws error if user not found
- Returns error promise with message

---

### Cue Service (`cueService.js`)

#### `getCues()`
Retrieves all cues in the marketplace.

**Returns:**
```javascript
Promise<Array<{
  id: number,
  title: string,
  brand: string,
  price: number,
  condition: string,
  material: string,
  weight: number,
  length: number,
  tip_size: number,
  description: string,
  images: Array<string>,
  seller_name: string,
  seller_email: string,
  seller_phone: string,
  location: string,
  is_sold: boolean,
  createdAt: string
}>>
```

#### `deleteCue(cueId)`
Deletes a specific cue from the marketplace.

**Parameters:**
```javascript
cueId: number              // ID of the cue to delete
```

**Returns:**
```javascript
Promise<{ success: boolean }>
```

**Example:**
```javascript
await cueService.deleteCue(42);
```

---

### Auth Context (`AuthContext.js`)

#### `updateUser(profileData)`
Updates the logged-in user's profile in the React context and calls the backend API.

**Parameters:**
```javascript
profileData: object        // Same as authService.updateUserProfile
```

**Returns:**
```javascript
Promise<object>            // Updated user object
```

**Example:**
```javascript
const { updateUser } = useAuth();

await updateUser({
  phone: "+1 (555) 123-4567",
  email: "user@example.com",
  location: "Boston, MA",
  address: { street: "456 Oak Ave", city: "Boston", ... }
});
```

**Side Effects:**
- Updates `user` state in context
- Calls `authService.updateUserProfile()` for backend persistence
- Makes updated user available to all context consumers

---

## Data Models

### User Object
```javascript
{
  id: number,
  username: string,
  name: string,
  email: string,
  role: "user" | "admin",
  phone?: string,
  location?: string,
  address?: {
    street?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    country?: string
  }
}
```

### Cue Object
```javascript
{
  id: number,
  title: string,
  brand: string,
  price: number,
  condition: "Like New" | "Used" | "Vintage",
  material: string,
  weight: number,
  length: number,
  tip_size: number,
  description: string,
  images: Array<string>,
  seller_name: string,
  seller_email: string,
  seller_phone: string,
  location: string,
  is_sold: boolean,
  createdAt: ISO8601_timestamp
}
```

---

## Component Usage Examples

### Using `updateUser` in Components

```javascript
import { useAuth } from '../auth/AuthContext';

export function MyComponent() {
  const { user, updateUser } = useAuth();

  const handleSaveProfile = async (newData) => {
    try {
      const updated = await updateUser(newData);
      console.log('Profile updated:', updated);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div>
      <p>Current phone: {user?.phone}</p>
      <button onClick={() => handleSaveProfile({ phone: '+1 (555) 000-0000' })}>
        Update Phone
      </button>
    </div>
  );
}
```

### Filtering User's Cues

```javascript
import * as cueService from '../api/cueService';
import { useAuth } from '../auth/AuthContext';

export function UserCuesList() {
  const { user } = useAuth();
  const [userCues, setUserCues] = useState([]);

  useEffect(() => {
    async function loadUserCues() {
      const allCues = await cueService.getCues();
      // Filter cues posted by current user
      const filtered = allCues.filter(c => c.seller_name === user?.name);
      setUserCues(filtered);
    }

    if (user) {
      loadUserCues();
    }
  }, [user]);

  return (
    <div>
      {userCues.map(cue => (
        <div key={cue.id}>
          <h3>{cue.title}</h3>
          <p>${cue.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Deleting a Cue with Confirmation

```javascript
const handleDeleteCue = async (cueId) => {
  if (!window.confirm('Are you sure? This cannot be undone.')) {
    return;
  }

  try {
    await cueService.deleteCue(cueId);
    // Remove from local state
    setCues(cues.filter(c => c.id !== cueId));
    showSuccessMessage('Cue deleted');
  } catch (error) {
    showErrorMessage('Failed to delete cue: ' + error.message);
  }
};
```

---

## Backend Integration

### Current Implementation
- Uses in-memory data storage (for development)
- All changes persist within the current session
- No database persistence (yet)

### Future .NET Backend Integration

When connecting to the backend, update these methods:

#### 1. `authService.updateUserProfile()`
```javascript
export async function updateUserProfile(userId, profileData) {
  const response = await fetch(`/api/users/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  
  return response.json();
}
```

#### 2. `cueService.getUserCues()`
```javascript
export async function getUserCues(userId) {
  const response = await fetch(`/api/cues?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cues');
  }
  return response.json();
}
```

---

## Error Handling

### Common Errors

**User Not Found**
```
Error: User not found
```
- Occurs when updateUserProfile called with invalid userId
- Check that user.id is valid

**Network Error**
```
Error: Network request failed
```
- Backend is unavailable
- Check API endpoint accessibility

**Validation Error**
```
Error: Invalid email format
```
- Submitted data doesn't meet validation rules
- Validate before submission

### Error Recovery Strategies

```javascript
try {
  await updateUser(profileData);
} catch (error) {
  if (error.message.includes('User not found')) {
    // User session expired, redirect to login
    logout();
  } else if (error.message.includes('Network')) {
    // Show offline message, allow retry
    showOfflineMessage();
  } else {
    // Generic error
    showErrorMessage(error.message);
  }
}
```

---

## Performance Considerations

### Optimization Tips

1. **Debounce Profile Saves**
   ```javascript
   const debouncedSave = useMemo(
     () => debounce(updateUser, 500),
     []
   );
   ```

2. **Batch Cue Loads**
   - Filter locally instead of making API calls per cue
   - Cache results in component state

3. **Lazy Load User Cues**
   - Only fetch when user opens "My Cues" tab
   - Don't load until needed

### Caching Strategy

```javascript
const [cachedCues, setCachedCues] = useState(null);

useEffect(() => {
  // Use cache if available and user hasn't changed
  if (cachedCues && lastUserId === user?.id) {
    return;
  }

  loadCues();
}, [user?.id]);
```

---

## Testing

### Unit Test Examples

```javascript
// Test profile update
test('updateUser updates context', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  
  await act(async () => {
    await result.current.updateUser({ phone: '+1 (555) 123-4567' });
  });
  
  expect(result.current.user.phone).toBe('+1 (555) 123-4567');
});

// Test cue deletion
test('deleteCue removes from list', async () => {
  const initialCues = [{ id: 1 }, { id: 2 }];
  const result = await deleteCue(1);
  expect(result.success).toBe(true);
});
```

### Integration Test Example

```javascript
test('full profile update flow', async () => {
  // 1. Login
  const user = await login('admin', 'admin');
  
  // 2. Update profile
  const updated = await authService.updateUserProfile(user.id, {
    phone: '+1 (555) 123-4567'
  });
  
  // 3. Verify update
  expect(updated.user.phone).toBe('+1 (555) 123-4567');
  
  // 4. Verify context updated
  const current = authService.getCurrent();
  expect(current.phone).toBe('+1 (555) 123-4567');
});
```

---

## References

- [UserProfile Component](./src/components/UserProfile.js)
- [AuthContext](./src/auth/AuthContext.js)
- [Auth Service](./src/api/authService.js)
- [Cue Service](./src/api/cueService.js)
- [User Profile Implementation Guide](./USER_PROFILE_IMPLEMENTATION.md)
