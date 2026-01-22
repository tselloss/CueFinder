# Admin Dashboard Moderation & User Management

## Overview
The admin dashboard provides comprehensive tools for managing users and moderating content. This document explains how flagged content is handled and what happens when users are deleted.

## Admin Dashboard Features

### ✅ Current Features

#### 1. **Statistics Dashboard**
- **Total Users**: Count of all registered users
- **Total Listings**: Count of all cues and cases
- **Flagged Content**: Count of listings with `IsFlagged = true`
- **Users with Flags**: Count of users who have uploaded flagged content

#### 2. **Flagged Content Alert**
- Shows warning banner when flagged content exists
- Displays count of flagged listings and users
- Orange highlight for high visibility

#### 3. **User Management Table**
Displays all users with:
- **Flag Indicator**: Orange flag icon next to users with flagged content
- **Name & Email**: User identification
- **Role Badge**: Admin (blue shield) or User (gray)
- **Status Badge**: ACTIVE (green) or INACTIVE (red)
- **Actions**:
  - **Edit**: Modify user details (name, email, role)
  - **Ban/Unban**: Toggle user active status
  - **Delete**: Remove user (see cascade behavior below)

#### 4. **Listings Management Table**
Shows all cues and cases with:
- **Title**: Listing name
- **Price**: Item price
- **Flagged Badge**: Orange "FLAGGED" badge for moderation review
- **Actions**:
  - **Flag**: Mark listing for moderation
  - **Delete**: Remove listing

### 📊 Flagged Content Detection
Content is flagged when:
- **IsFlagged = true** on Cue or CueCase models
- Admin manually flags via dashboard
- NSFW image detection service flags images

Flagged content fields in database:
```csharp
// On Cue model
public bool IsFlagged { get; set; } = false;

// On CueCase model
public bool IsFlagged { get; set; } = false;
```

## Delete User Functionality

### ⚠️ **CRITICAL: User Deletion is Restricted**

**When you try to delete a user who has posted cues, the deletion will FAIL.**

This is by design to prevent accidental data loss.

### Database Cascade Rules

#### **RESTRICTED (User CANNOT be deleted if they exist)**
These relationships prevent user deletion:

1. **Cues** (`OnDelete(DeleteBehavior.Restrict)`)
   - If user has posted any cues, deletion is blocked
   - Error: "Cannot delete user - they have active cues"

2. **Ratings** (`OnDelete(DeleteBehavior.Restrict)`)
   - If user has given or received ratings, deletion is blocked

3. **Messages** (`OnDelete(DeleteBehavior.Restrict)`)
   - If user has sent or received messages, deletion is blocked

4. **Transactions** (`OnDelete(DeleteBehavior.Restrict)`)
   - If user is buyer or seller in transactions, deletion is blocked

5. **FlaggedImages** (`OnDelete(DeleteBehavior.Restrict)`)
   - If user has flagged images, deletion is blocked

#### **CASCADE (Deleted WITH user)**
These will be automatically deleted when user is deleted:

1. **CueCases** (`OnDelete(DeleteBehavior.Cascade)`)
   - All user's cue cases are deleted
   - Case images are also deleted (cascading delete)

2. **SavedCues** (`OnDelete(DeleteBehavior.Cascade)`)
   - User's saved cue bookmarks are deleted

3. **PhoneVerificationTokens** (`OnDelete(DeleteBehavior.Cascade)`)
   - User's verification tokens are deleted

### 🔧 How to Delete a User with Content

#### **Option 1: Delete User Content First (Recommended)**
```sql
-- 1. Delete or reassign user's cues
DELETE FROM "Cues" WHERE "UserId" = <user_id>;

-- 2. Delete user's messages
DELETE FROM "Messages" WHERE "SenderId" = <user_id> OR "RecipientId" = <user_id>;

-- 3. Delete user's ratings
DELETE FROM "Ratings" WHERE "RatedByUserId" = <user_id> OR "SellerUserId" = <user_id>;

-- 4. Delete flagged images
DELETE FROM "FlaggedImages" WHERE "UserId" = <user_id>;

-- 5. Now delete the user
DELETE FROM "Users" WHERE "Id" = <user_id>;
```

#### **Option 2: Ban User Instead**
If you don't want to delete content, ban the user:
- Click **"Ban User"** button in admin dashboard
- Sets `IsActive = false`
- User cannot log in but content remains
- Reversible action

#### **Option 3: Add Cascade Delete for Cues**
Modify [CueFinderDbContext.cs](c:\\Users\\karac\\source\\repos\\CueFinder\\SolutionLibraries\\CueFinder.Database\\Context\\CueFinderDbContext.cs):

```csharp
// Change line 88 from:
entity.HasOne(e => e.User)
    .WithMany(u => u.PostedCues)
    .HasForeignKey(e => e.UserId)
    .OnDelete(DeleteBehavior.Restrict);

// To:
entity.HasOne(e => e.User)
    .WithMany(u => u.PostedCues)
    .HasForeignKey(e => e.UserId)
    .OnDelete(DeleteBehavior.Cascade);
```

**⚠️ WARNING**: This will delete ALL user's cues when user is deleted!

## Moderation Workflow

### 1. Identify Users with Flagged Content
- View admin dashboard
- Check "Users w/ Flags" statistic
- Look for orange flag icons (🚩) next to user names

### 2. Review Flagged Listings
- Scroll to "Listings Management" section
- Filter mentally for orange "FLAGGED" badges
- Check listing details

### 3. Take Action
**For flagged content:**
- Click "Delete" to remove the listing
- User keeps their account

**For repeat offenders:**
- Click "Ban User" to deactivate account
- Or delete user (if they have no other content)

**For false positives:**
- Manually unflag in database:
  ```sql
  UPDATE "Cues" SET "IsFlagged" = false WHERE "Id" = <cue_id>;
  ```

## API Endpoints

### Admin User Management
- **GET** `/api/users` - Get all users (admin only)
- **PUT** `/api/users/{id}` - Update user (admin only)
- **DELETE** `/api/users/{id}` - Delete user (admin only)

All endpoints require `[Authorize(Roles = "admin")]`

### Delete User Response
```json
// Success
{
  "success": true
}

// User not found
{
  "message": "User not found"
}

// Foreign key constraint (user has content)
{
  "error": "Cannot delete user - they have active cues"
}
```

## Frontend Code

### AdminPage.jsx Key Components

#### Delete User with Confirmation
```jsx
const deleteUser = async (id) => {
  if (!window.confirm('Are you sure you want to delete this user?')) return;
  try {
    await adminUsers.deleteUser(id);
    setUsers((s) => s.filter((u) => u.id !== id));
  } catch (error) {
    alert('Cannot delete user - they have active listings or content');
  }
};
```

#### User with Flagged Content Indicator
```jsx
<div className="flex items-center gap-2">
  <span className="font-medium">{user.name}</span>
  {usersWithFlaggedContent.some(u => u.id === user.id) && (
    <Flag className="w-4 h-4 text-orange-500" title="Has flagged content" />
  )}
</div>
```

#### Flagged Content Statistics
```jsx
const flaggedListings = useMemo(() => 
  listings.filter(l => l.flagged), [listings]
);

const usersWithFlaggedContent = useMemo(() => {
  const flaggedUserIds = new Set(flaggedListings.map(l => l.userId).filter(Boolean));
  return users.filter(u => flaggedUserIds.has(u.id));
}, [users, flaggedListings]);
```

## Testing Checklist

### ✅ Test Delete User
1. Create test user
2. Have user post a cue
3. Try to delete user from admin dashboard
4. **Expected**: Error - "Cannot delete user"
5. Delete the cue first
6. Try to delete user again
7. **Expected**: Success

### ✅ Test Flagged Content Display
1. Create test cue
2. Set `IsFlagged = true` in database
3. View admin dashboard
4. **Expected**: 
   - Flagged content count increased
   - User has flag icon
   - Orange alert banner shows

### ✅ Test Ban User
1. Select user
2. Click "Ban User"
3. Check user status
4. **Expected**: Status shows "INACTIVE"
5. Try to login as that user
6. **Expected**: Login fails

## Database Schema

### IsFlagged Columns
```sql
-- Cue table
ALTER TABLE "Cues" ADD COLUMN "IsFlagged" BOOLEAN DEFAULT FALSE;

-- CueCase table
ALTER TABLE "CueCases" ADD COLUMN "IsFlagged" BOOLEAN DEFAULT FALSE;

-- Message table (for forum)
ALTER TABLE "Messages" ADD COLUMN "IsFlagged" BOOLEAN DEFAULT FALSE;

-- Forum tables
ALTER TABLE "Posts" ADD COLUMN "IsFlagged" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Discussions" ADD COLUMN "IsFlagged" BOOLEAN DEFAULT FALSE;
```

### Foreign Key Constraints
```sql
-- Cue -> User (RESTRICT)
ALTER TABLE "Cues" 
  ADD CONSTRAINT "FK_Cues_Users_UserId" 
  FOREIGN KEY ("UserId") REFERENCES "Users"("Id") 
  ON DELETE RESTRICT;

-- CueCase -> User (CASCADE)
ALTER TABLE "CueCases" 
  ADD CONSTRAINT "FK_CueCases_Users_UserId" 
  FOREIGN KEY ("UserId") REFERENCES "Users"("Id") 
  ON DELETE CASCADE;
```

## Production Safety

### Before Deleting Users in Production

1. **Backup Database**
   ```bash
   docker exec cuefinder-postgres-prod pg_dump -U postgres cuefinder > backup.sql
   ```

2. **Check User Content**
   ```sql
   SELECT 
     u."Id", u."Name", u."Email",
     (SELECT COUNT(*) FROM "Cues" WHERE "UserId" = u."Id") as cue_count,
     (SELECT COUNT(*) FROM "CueCases" WHERE "UserId" = u."Id") as case_count,
     (SELECT COUNT(*) FROM "Messages" WHERE "SenderId" = u."Id") as message_count,
     (SELECT COUNT(*) FROM "Ratings" WHERE "RatedByUserId" = u."Id") as rating_count
   FROM "Users" u
   WHERE u."Id" = <user_id>;
   ```

3. **Use Ban Instead of Delete**
   - Safer option
   - Reversible
   - Preserves content for review

4. **Document Actions**
   - Keep audit trail
   - Note reason for deletion
   - Record deleted content

## Summary

✅ **Admin Dashboard Now Shows:**
- Users with flagged content (flag icon)
- Flagged content statistics
- Warning alerts for moderation review

⚠️ **Delete User Behavior:**
- **BLOCKED** if user has cues, ratings, messages, or transactions
- **ALLOWED** if user only has cases (cases are deleted too)
- Use **Ban** instead for safety

🔧 **Recommended Workflow:**
1. Flag inappropriate content
2. Review flagged items
3. Delete individual listings
4. Ban repeat offenders
5. Only delete users with no content

## Next Steps

1. **Add Moderation Queue UI** - Show pending flagged items
2. **Add Bulk Actions** - Delete multiple flagged items at once
3. **Add User Content Preview** - Show user's listings before delete
4. **Add Cascade Delete Option** - Admin setting to enable/disable
5. **Add Audit Log** - Track all admin actions
