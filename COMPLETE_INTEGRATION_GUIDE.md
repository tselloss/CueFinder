# Complete Integration Guide: Database-Integrated Authentication

## Overview

Your CueFinder application now has **two authentication options**:

1. **In-Memory AuthService** (Development/Testing)
2. **DatabaseAuthService** (Production) ← You want this!

This guide walks you through integrating the DatabaseAuthService to read from and write to the database.

---

## What's New

### Files Created

✅ `DatabaseAuthService.cs` - Main service (authentication + DB integration)
✅ `DatabaseAuthServiceExtension.cs` - Dependency injection setup
✅ `DATABASE_AUTH_GUIDE.md` - Complete reference documentation
✅ `PROGRAM_CS_EXAMPLE.cs` - Ready-to-use Program.cs
✅ `AuthController_EXAMPLE.cs` - Documented controller example
✅ `AUTHENTICATION_DATABASE_INTEGRATION.md` - Integration summary

### Files Modified

✅ `CueFinder.Auth.csproj` - Added CueFinder.Database project reference

---

## Step-by-Step Integration

### Step 1: Update Program.cs

Replace your current `Program.cs` in `CueFinderBE/` with the configuration from `PROGRAM_CS_EXAMPLE.cs`:

```csharp
using CueFinder.Auth.Extensions;
using CueFinder.Database.Extensions;

var builder = WebApplicationBuilder.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

// Get connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string not found.");

// ✨ NEW: Add database services
builder.Services.AddDatabaseServices(connectionString);

// ✨ NEW: Use database auth instead of in-memory
builder.Services.AddDatabaseAuthServices();

// Add CORS, Authentication, etc.
builder.Services.AddCors(/* ... */);

var app = builder.Build();

// ✨ NEW: Initialize database on startup
await app.Services.InitializeDatabaseAsync();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

**Key Changes:**
- Added `using CueFinder.Database.Extensions;`
- Added `AddDatabaseServices(connectionString)`
- Changed from `AddAuthServices()` to `AddDatabaseAuthServices()`
- Added `await app.Services.InitializeDatabaseAsync()`

### Step 2: Update appsettings.json

Add/update the connection string in `CueFinderBE/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=CueFinderDb;Trusted_Connection=true;Encrypt=false;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "CueFinder.Auth": "Information",
      "CueFinder.Database": "Information"
    }
  },
  "Cors": {
    "Frontend": "http://localhost:3000"
  }
}
```

**For Production SQL Server:**
```json
"DefaultConnection": "Server=your-server;Database=CueFinderDb;User Id=sa;Password=YourPassword;Encrypt=true;TrustServerCertificate=false;"
```

### Step 3: Update CueFinderBE.csproj

Ensure CueFinderBE references both auth and database projects:

```xml
<ItemGroup>
  <ProjectReference Include="../CueFinder.Auth/CueFinder.Auth.csproj" />
  <ProjectReference Include="../CueFinder.Database/CueFinder.Database.csproj" />
</ItemGroup>
```

### Step 4: Create Database Migrations

From the `CueFinderBE` directory, create initial migration:

```bash
dotnet ef migrations add InitialCreate --project ../CueFinder.Database/CueFinder.Database.csproj
```

This creates:
- `/CueFinder.Database/Migrations/` folder
- Migration files for creating all tables

### Step 5: Apply Migrations

Apply the migrations to create the database:

```bash
dotnet ef database update --project ../CueFinder.Database/CueFinder.Database.csproj
```

This will:
- Create the database (CueFinderDb)
- Create all tables (Users, Cues, CueImages, Ratings, Messages, SavedCues, Transactions)
- Create all indexes
- Apply constraints

### Step 6: Verify Database Creation

Check that the database was created:

**SQL Server Management Studio:**
1. Connect to your SQL Server
2. Look for database named "CueFinderDb"
3. Expand to see tables: Users, Cues, CueImages, Ratings, Messages, SavedCues, Transactions

**PowerShell Query:**
```powershell
sqlcmd -S . -Q "SELECT name FROM sys.databases WHERE name = 'CueFinderDb'"
```

### Step 7: Run CueFinderBE

```bash
cd CueFinderBE
dotnet run
```

You should see:
```
Information: Database initialized successfully
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7200
```

---

## How It Works

### Registration Flow

```
1. User submits registration form (Frontend)
   └─ POST /api/auth/register
      {
        "username": "john",
        "password": "secure123",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-1234"
      }

2. AuthController receives request

3. DatabaseAuthService.RegisterAsync() executes:
   ├─ Validate input (non-empty required fields)
   ├─ Check password length (minimum 6)
   ├─ IUserService.UserExistsAsync("john") → Query DB
   │  └─ If exists, throw error
   ├─ IUserService.EmailExistsAsync("john@example.com") → Query DB
   │  └─ If exists, throw error
   ├─ HashPassword("secure123") → SHA256 hash
   ├─ Create User object with hashed password
   ├─ IUserService.CreateUserAsync(user) → INSERT into Users table
   ├─ TokenService.GenerateToken() → Create JWT
   └─ Return AuthResponse with token

4. AuthResponse returned to Frontend:
   {
     "accessToken": "eyJhbGc...",
     "userId": 1,
     "username": "john",
     "name": "John Doe",
     "email": "john@example.com",
     "phone": "555-1234",
     "role": "user",
     "expiresIn": 3600
   }

5. Frontend stores token in localStorage
```

### Login Flow

```
1. User submits login form (Frontend)
   └─ POST /api/auth/login
      {
        "username": "john",
        "password": "secure123"
      }

2. AuthController receives request

3. DatabaseAuthService.LoginAsync() executes:
   ├─ IUserService.GetByUsernameAsync("john") → Query DB
   │  └─ If not found, try email
   ├─ VerifyPassword("secure123", user.PasswordHash)
   │  └─ Hash input and compare with DB hash
   ├─ If password wrong, throw UnauthorizedAccessException
   ├─ Check user.IsActive == true
   │  └─ If false, throw error "Account is disabled"
   ├─ Update user.LastLoginAt = DateTime.UtcNow
   ├─ IUserService.UpdateUserAsync(user) → UPDATE Users table
   ├─ TokenService.GenerateToken() → Create JWT
   └─ Return AuthResponse

4. Frontend receives token and user info
```

### Profile Retrieval Flow

```
1. User requests profile (Frontend)
   └─ GET /api/auth/me
      Authorization: Bearer <token>

2. Middleware validates JWT token

3. AuthController.GetCurrentUser() executes:
   ├─ Extract userId from JWT claims
   ├─ DatabaseAuthService.GetUserProfileAsync(userId)
   │  └─ IUserService.GetUserWithDetailsAsync(userId) → Query Users by ID
   └─ Return UserProfile object

4. Frontend displays user profile
```

---

## Database Schema Created

The migration creates the following User table:

```sql
CREATE TABLE [Users] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Username] NVARCHAR(50) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(500) NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(100) NOT NULL UNIQUE,
    [Phone] NVARCHAR(20),
    [Role] NVARCHAR(50) DEFAULT 'user',
    [ProfilePictureUrl] NVARCHAR(500),
    [Bio] NVARCHAR(500),
    [Address] NVARCHAR(200),
    [City] NVARCHAR(100),
    [State] NVARCHAR(100),
    [ZipCode] NVARCHAR(20),
    [Country] NVARCHAR(100),
    [IsEmailVerified] BIT DEFAULT 0,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [LastLoginAt] DATETIME2 NULL
);

CREATE UNIQUE INDEX [IX_User_Username] ON [Users]([Username]);
CREATE UNIQUE INDEX [IX_User_Email] ON [Users]([Email]);
```

---

## Testing the Integration

### Test 1: Register a User

```bash
curl -X POST http://localhost:5200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "555-9999"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "phone": "555-9999",
  "role": "user",
  "expiresIn": 3600
}
```

**Check Database:**
```sql
SELECT * FROM Users WHERE Username = 'testuser';
```

You should see the user with hashed password!

### Test 2: Login with Credentials

```bash
curl -X POST http://localhost:5200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'
```

**Expected Response:** Same AuthResponse with token

### Test 3: Get User Profile

```bash
curl -X GET http://localhost:5200/api/auth/me \
  -H "Authorization: Bearer <your-token-here>"
```

**Expected Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "phone": "555-9999",
  "role": "user",
  "createdAt": "2024-01-03T14:30:00Z",
  "updatedAt": "2024-01-03T14:30:00Z"
}
```

### Test 4: Update Profile

```bash
curl -X PUT http://localhost:5200/api/auth/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "newemail@example.com",
    "phone": "555-1111"
  }'
```

**Check Database:**
```sql
SELECT * FROM Users WHERE Id = 1;
```

You should see updated values!

---

## Troubleshooting

### Issue: "Connection string 'DefaultConnection' not found"

**Solution:** Check appsettings.json has ConnectionStrings section

### Issue: Migration fails

**Solution:** 
```bash
# Check database exists
sqlcmd -S . -Q "SELECT name FROM sys.databases WHERE name = 'CueFinderDb'"

# If not, create it manually
dotnet ef database update
```

### Issue: Login returns "User not found"

**Solution:**
- Check user exists in database: `SELECT * FROM Users;`
- Verify username is correct
- Check case sensitivity (usernames are case-insensitive in code)

### Issue: Password verification fails

**Solution:**
- Verify password in database is hashed
- Check VerifyPassword logic
- Try registering a new user to test full flow

### Issue: "Account is disabled" on login

**Solution:**
```sql
UPDATE Users SET IsActive = 1 WHERE Id = 1;
```

---

## Security Checklist

- ✅ Passwords hashed (SHA256) before storage
- ✅ Username and email are unique
- ✅ Account status validation (IsActive)
- ✅ JWT token validation on protected endpoints
- ✅ Error messages are generic (no user enumeration)
- ✅ All operations logged
- ⏳ Consider upgrading to bcrypt for production
- ⏳ Add password complexity validation
- ⏳ Add rate limiting on login attempts
- ⏳ Add email verification
- ⏳ Add password reset functionality

---

## What Happens Now

When a user joins your app:

1. **Registration Page**
   - User enters username, password, name, email, phone
   - Data sent to `/api/auth/register`
   - DatabaseAuthService validates and hashes password
   - User record saved to Users table in database
   - JWT token generated and returned
   - User logged in immediately

2. **Login**
   - User enters username and password
   - DatabaseAuthService queries Users table
   - Password verified against hash
   - LastLoginAt updated in database
   - JWT token generated and returned

3. **Profile Access**
   - User requests `/api/auth/me`
   - JWT token validated
   - User profile retrieved from database
   - All user info displayed

4. **Profile Update**
   - User updates name, email, phone
   - Data sent to `/api/auth/me` PUT request
   - DatabaseAuthService updates Users table
   - UpdatedAt timestamp auto-updated
   - New profile returned

---

## Next Steps

1. ✅ Copy `PROGRAM_CS_EXAMPLE.cs` to `Program.cs`
2. ✅ Update `appsettings.json` with connection string
3. ✅ Run migration: `dotnet ef migrations add InitialCreate`
4. ✅ Apply migration: `dotnet ef database update`
5. ✅ Run application: `dotnet run`
6. ✅ Test endpoints with curl or Postman
7. ✅ Test from frontend
8. ✅ Verify user data in database
9. ✅ Check logs for any issues

---

## Support Files

All documentation is in the repository:

- **DATABASE_AUTH_GUIDE.md** - Complete reference
- **AUTHENTICATION_DATABASE_INTEGRATION.md** - Integration summary
- **PROGRAM_CS_EXAMPLE.cs** - Ready-to-use config
- **AuthController_EXAMPLE.cs** - Documented endpoints
- **CueFinder.Database/README.md** - Database layer docs

---

## Summary

You now have:

✅ **DatabaseAuthService** - Handles auth with database
✅ **User table** - Stores user data with hashed passwords
✅ **Automatic initialization** - Database created on startup
✅ **Password security** - SHA256 hashing
✅ **Error handling** - Comprehensive validation
✅ **Logging** - All operations logged
✅ **Documentation** - Complete guides and examples

Your app can now **store and retrieve user information from the database**! 🎉
