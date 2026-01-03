# Quick Start: CueFinder Authentication

## Getting Started in 5 Minutes

### Backend (C# .NET 8)

1. **Start the backend**:
   ```powershell
   cd C:\Users\karac\source\repos\CueFinder\CueFinderBE
   dotnet run
   ```
   - Backend runs on: `http://localhost:5000` or `https://localhost:5001`

2. **Test the auth endpoint**:
   ```powershell
   # PowerShell
   $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
     -Method POST `
     -Headers @{"Content-Type"="application/json"} `
     -Body '{"username":"admin","password":"admin123"}' `
     -SkipHttpsVerification
   $response.Content | ConvertFrom-Json
   ```

### Frontend (React)

1. **Install dependencies**:
   ```bash
   cd C:\Users\karac\source\repos\CueFinder\CueFinderFE\cuefinderfe
   npm install
   ```

2. **Check `.env.development`**:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start the frontend**:
   ```bash
   npm start
   ```
   - Frontend opens at: `http://localhost:3000`

### Test Login

1. Click "Sign in" on login page
2. Use test credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Should redirect to main app
4. See "Signed in as Administrator (admin)" at top

## File Structure Created

### Backend Files

```
CueFinderBE/CueFinder.Auth/
├── Controllers/
│   └── AuthController.cs              # 6 endpoints (login, register, profile, etc.)
├── Services/
│   ├── AuthService.cs                 # Auth logic (100+ users in-memory)
│   └── TokenService.cs                # JWT token generation
├── Interfaces/
│   ├── IAuthService.cs
│   └── ITokenService.cs
├── Models/
│   ├── LoginRequest.cs
│   ├── RegisterRequest.cs
│   ├── AuthResponse.cs
│   ├── UserProfile.cs
│   └── UpdateProfileRequest.cs
├── Extensions/
│   └── AuthServiceExtension.cs        # Dependency injection setup
└── CueFinder.Auth.csproj
```

### Frontend Files

```
CueFinderFE/cuefinderfe/src/
├── api/
│   └── authService.js                 # Refactored to use backend API
├── config/
│   └── apiConfig.js                   # NEW: Centralized API endpoints
├── utils/
│   └── httpClient.js                  # NEW: HTTP helper with JWT
└── .env.development                   # NEW: API URL configuration
```

## Authentication Flow

```
User Login Form
    ↓
authService.login(username, password)
    ↓
POST /api/auth/login
    ↓
Backend validates credentials
    ↓
TokenService.GenerateToken()
    ↓
Return JWT + user info
    ↓
Frontend stores JWT in localStorage
    ↓
All subsequent requests include: Authorization: Bearer <JWT>
```

## API Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | New user registration |
| GET | `/api/auth/me` | Get current user (requires JWT) |
| GET | `/api/auth/{id}` | Get user by ID (requires JWT) |
| PUT | `/api/auth/me` | Update profile (requires JWT) |
| GET | `/api/auth/verify` | Check if JWT valid (requires JWT) |

## JWT Token

- **Stored in**: `localStorage.authToken`
- **Sent via**: `Authorization: Bearer <token>` header
- **Expires in**: 60 minutes (configurable in appsettings.json)
- **Secret key**: Configured in `appsettings.json` → `JwtSettings:SecretKey`

## Test Users (Built-in)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| user | user123 | user |

## Common Issues

### "Cannot GET /api/auth/login"
- Backend not running, start with `dotnet run`

### CORS Error
- Frontend and backend running but different ports
- Check `CorsOrigins.Frontend` in `appsettings.json`
- Should be `http://localhost:3000`

### "Invalid token" after login
- JWT secret mismatch (shouldn't happen with defaults)
- Browser cache - clear localStorage and reload
- Token expired - login again

## Next: Call Protected APIs

Now that auth is set up, other backend modules can use JWT validation:

```csharp
[Authorize]
[HttpGet("api/cues")]
public IActionResult GetCues()
{
    // Only authenticated users can call this
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    // ... return cues for this user
}
```

Frontend automatically includes JWT:

```javascript
const cues = await fetch('/api/cues', {
  headers: { 'Authorization': `Bearer ${localStorage.authToken}` }
});
```

## Success Checklist

- [ ] Backend runs without errors on port 5000
- [ ] Frontend runs on port 3000
- [ ] Login with admin/admin123 works
- [ ] JWT stored in localStorage after login
- [ ] Profile page loads (requires JWT)
- [ ] Logout clears JWT
- [ ] Login again required to access protected pages

## Questions?

Refer to `AUTHENTICATION_SETUP.md` for detailed documentation.
