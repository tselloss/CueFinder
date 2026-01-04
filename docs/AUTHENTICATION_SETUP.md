# CueFinder Authentication Implementation Guide

## Overview

This document describes the complete authentication setup connecting the CueFinderFE (React) frontend to the CueFinderBE (.NET 8) backend using JWT (JSON Web Tokens).

## Backend Architecture

### Auth Module Structure

```
CueFinderBE/
├── CueFinder.Auth/
│   ├── Controllers/
│   │   └── AuthController.cs          # API endpoints
│   ├── Services/
│   │   ├── AuthService.cs             # Auth business logic
│   │   └── TokenService.cs            # JWT token generation
│   ├── Interfaces/
│   │   ├── IAuthService.cs
│   │   └── ITokenService.cs
│   ├── Models/
│   │   ├── LoginRequest.cs
│   │   ├── RegisterRequest.cs
│   │   ├── AuthResponse.cs
│   │   ├── UserProfile.cs
│   │   └── UpdateProfileRequest.cs
│   ├── Extensions/
│   │   └── AuthServiceExtension.cs    # DI configuration
│   └── CueFinder.Auth.csproj
```

### API Endpoints

#### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/auth/login` | Login with username and password | No |
| POST | `/api/auth/register` | Register a new user account | No |
| GET | `/api/auth/me` | Get current authenticated user profile | Yes |
| GET | `/api/auth/{id}` | Get user profile by ID | Yes |
| PUT | `/api/auth/me` | Update current user profile | Yes |
| GET | `/api/auth/verify` | Verify JWT token validity | Yes |
| POST | `/api/auth/send-sms` | Send SMS verification code | No |
| POST | `/api/auth/verify-sms` | Verify SMS code | No |

### Request/Response Models

#### Login Request
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

#### Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1,
  "username": "user",
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "555-1234",
  "role": "user",
  "expiresIn": 3600
}
```

#### Register Request
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

#### Update Profile Request
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567891"
}
```

## Frontend Architecture

### Frontend Structure

```
CueFinderFE/cuefinderfe/src/
├── api/
│   ├── authService.js                 # Auth API service
│   ├── cueService.js
│   ├── adminService.js
│   └── ...
├── auth/
│   └── AuthContext.js                 # Auth context provider
├── config/
│   └── apiConfig.js                   # API endpoint configuration
├── utils/
│   └── httpClient.js                  # HTTP request utility
├── components/
│   ├── LoginPage.js
│   ├── CueList.js
│   ├── UserProfile.js
│   └── ...
├── .env.development                   # Environment configuration
└── App.js
```

### Authentication Flow

1. **User Enters Credentials**: User fills in login/register form
2. **Frontend Sends Request**: `authService.js` sends request to backend
3. **Backend Validates**: `AuthController` validates credentials
4. **Token Generation**: `TokenService` generates JWT token
5. **Frontend Stores Token**: JWT stored in localStorage
6. **Authenticated Requests**: All subsequent requests include JWT in Authorization header

### API Service Layer

#### httpClient.js

Provides utility functions for making HTTP requests with automatic JWT token attachment:

```javascript
import { get, post, put, delete_ } from '../utils/httpClient';

// GET request with auto JWT
const profile = await get('/api/auth/me');

// POST request with auto JWT
const response = await post('/api/auth/login', { username, password });

// PUT request with auto JWT
await put('/api/auth/me', { name: 'New Name' });
```

#### authService.js

High-level authentication API service:

```javascript
import * as authService from '../api/authService';

// Login
const user = await authService.login('user@example.com', 'password');

// Register
const newUser = await authService.register('newuser', 'password', 'John Doe', '555-1234', 'john@example.com');

// Get current user
const profile = await authService.getCurrentProfile();

// Update profile
await authService.updateUserProfile(userId, { name: 'Jane Doe' });

// Logout
await authService.logout();
```

#### API Configuration

`apiConfig.js` centralizes all API endpoints:

```javascript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    CURRENT_USER: '/api/auth/me',
    GET_USER: (id) => `/api/auth/${id}`,
    UPDATE_PROFILE: '/api/auth/me',
    VERIFY_TOKEN: '/api/auth/verify',
    SEND_SMS: '/api/auth/send-sms',
    VERIFY_SMS: '/api/auth/verify-sms',
  },
  // ... other endpoints
};
```

### AuthContext

React Context for authentication state management:

```javascript
import { AuthProvider, useAuth } from './auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <YourComponent />
    </AuthProvider>
  );
}

function MyComponent() {
  const { user, login, logout, updateUser } = useAuth();
  
  return (
    <div>
      {user ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
```

## JWT Token Details

### Token Configuration

Located in `appsettings.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters",
    "Issuer": "CueFinder",
    "Audience": "CueFinderUsers",
    "ExpirationMinutes": 60
  }
}
```

### Token Claims

JWT token contains the following claims:

- `sub` (Subject): User ID
- `name` (Name): Username
- `role` (Role): User role (admin, user, etc.)
- `iss` (Issuer): CueFinder
- `aud` (Audience): CueFinderUsers
- `exp` (Expiration): Token expiration time
- `iat` (Issued At): Token creation time

### Token Usage

Frontend automatically includes JWT in request headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Running the Application

### Backend Setup

1. **Restore NuGet packages**:
   ```powershell
   cd CueFinderBE
   dotnet restore
   ```

2. **Update appsettings.json** (optional - change JWT secret):
   ```json
   {
     "JwtSettings": {
       "SecretKey": "your-new-secret-key-at-least-32-characters"
     }
   }
   ```

3. **Run the backend**:
   ```powershell
   dotnet run
   ```
   Backend runs on `https://localhost:5001` or `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd CueFinderFE/cuefinderfe
   npm install
   ```

2. **Configure API URL** in `.env.development`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start development server**:
   ```bash
   npm start
   ```
   Frontend runs on `http://localhost:3000`

## Testing Authentication

### Test Credentials

Default test users created in-memory:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| user | user123 | user |

### Testing Login Flow

1. Open frontend at `http://localhost:3000`
2. Login with credentials above
3. Check browser DevTools → Application → Local Storage → `authToken` contains JWT
4. Navigate to protected pages (requires authentication)
5. Logout and verify token is cleared

### Testing API with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'

# Get current user (with token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Update profile
curl -X PUT http://localhost:5000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"name":"New Name","email":"new@example.com"}'
```

## Error Handling

### Common Error Codes

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Bad Request | Invalid input, check request format |
| 401 | Unauthorized | Invalid credentials or expired token |
| 404 | Not Found | User not found |
| 500 | Server Error | Backend error, check server logs |

### Frontend Error Handling

```javascript
try {
  const user = await authService.login(username, password);
} catch (error) {
  if (error.status === 401) {
    setError('Invalid username or password');
  } else if (error.status === 500) {
    setError('Server error. Please try again later.');
  } else {
    setError(error.message);
  }
}
```

## Security Considerations

### For Development

- JWT secret key is set to a default value
- User passwords stored in-memory (no hashing)
- HTTPS not enforced in development

### For Production

1. **Change JWT Secret**:
   - Use strong, random 32+ character key
   - Store in Azure Key Vault or similar
   - Rotate regularly

2. **Hash Passwords**:
   - Use bcrypt or similar
   - Never store plain text passwords
   - Use secure password validation

3. **Enable HTTPS**:
   - Use valid SSL certificate
   - Set `SecureOnly` cookie flag
   - Redirect HTTP to HTTPS

4. **Token Refresh**:
   - Implement refresh token mechanism
   - Short-lived access tokens (15 min)
   - Longer-lived refresh tokens (7 days)

5. **CORS Configuration**:
   - Whitelist frontend URL in `appsettings.json`
   - Restrict methods and headers
   - Check production URL

6. **Input Validation**:
   - Validate all user inputs
   - Sanitize before storing
   - Check email format, phone format

## Troubleshooting

### Issue: CORS Error

**Solution**: Ensure frontend URL is in `appsettings.json`:
```json
{
  "CorsOrigins": {
    "Frontend": "http://localhost:3000"
  }
}
```

### Issue: 401 Unauthorized on protected routes

**Solution**: 
- Check token is stored in localStorage
- Verify token hasn't expired
- Check Authorization header is sent
- Try logging in again to refresh token

### Issue: Frontend can't reach backend

**Solution**:
- Backend must be running on configured port
- Check `REACT_APP_API_URL` in `.env.development`
- Ensure CORS is enabled
- Check firewall/network connectivity

### Issue: Token claims not found

**Solution**:
- Verify JWT secret matches between backend and frontend
- Check token format: `Bearer <token>`
- Ensure token not malformed
- Try refreshing page or logging in again

## Next Steps

1. Implement refresh token mechanism
2. Add password reset functionality
3. Add email verification
4. Implement role-based access control (RBAC)
5. Add audit logging
6. Set up two-factor authentication (2FA)
7. Implement remember me functionality
8. Add social login (Google, Apple, etc.)

## References

- [JWT Introduction](https://jwt.io/introduction)
- [ASP.NET Core Authentication](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/)
- [React Authentication Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
