# Agent Instructions: Password Reset Feature

## When to Use This

Use these instructions when working on:
- Password reset flow (forgot password, reset password)
- Email sending for authentication
- Token-based authentication flows
- Security-related features

## Architecture

### Token Security
- **Never store plaintext tokens** in the database
- Always hash tokens with SHA-256 + server pepper
- One-time use enforced via `IsUsed` flag
- 30-minute expiration (configurable)

### Account Enumeration Prevention
```csharp
// ✅ Correct: Uniform response
return Ok(new { message = "If an account exists..." });

// ❌ Wrong: Reveals if account exists
if (user == null) return NotFound(new { message = "User not found" });
```

### Rate Limiting
- Track by user ID (5 requests per 60 minutes)
- Future: Add IP-based rate limiting
- Return 429 Too Many Requests when exceeded

## Code Patterns

### Generating Reset Tokens
```csharp
// 1. Generate cryptographically secure random bytes
using (var rng = RandomNumberGenerator.Create())
{
    byte[] tokenBytes = new byte[32];
    rng.GetBytes(tokenBytes);
    string plainToken = Convert.ToBase64String(tokenBytes);
    
    // 2. Hash before storing
    string tokenHash = HashToken(plainToken, _serverPepper);
    
    // 3. Store hash, return plain token for email
}
```

### Validating Tokens
```csharp
// 1. Hash the incoming token
string tokenHash = HashToken(token, _serverPepper);

// 2. Find in DB with all conditions
var resetToken = await _dbContext.PasswordResetTokens
    .FirstOrDefaultAsync(t => 
        t.TokenHash == tokenHash &&
        !t.IsUsed &&
        t.ExpiresAt > DateTime.UtcNow);
```

### Password Reset
```csharp
// 1. Validate token
// 2. Mark token as used
resetToken.IsUsed = true;
resetToken.UsedAt = DateTime.UtcNow;

// 3. Update password with BCrypt
user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);
user.PasswordHashVersion = 2;

// 4. Save changes
await _dbContext.SaveChangesAsync();
```

## Email Templates

### Structure
- Use HTML email with responsive design
- Include CueFinder branding
- Show security info (IP, User Agent)
- Provide fallback plain text link
- Clear expiration notice (30 minutes)

### Example
See `AuthController.BuildPasswordResetEmailBody()` for full template.

## Frontend Components

### ForgotPassword.jsx
- Single input (email or username)
- Show success page after submission
- Auto-redirect to login after 5 seconds
- Client-side rate limiting feedback

### ResetPassword.jsx
- Validate token on page load
- Show password strength indicator
- Real-time requirement checklist
- Show/hide password toggles
- Auto-redirect after successful reset

## Testing

### Unit Tests
```csharp
[Fact]
public async Task GenerateResetToken_ValidUser_ReturnsToken()
{
    // Arrange, Act, Assert
}
```

### Integration Tests
```powershell
# Run E2E test script
.\tests\test-password-reset.ps1
```

### Security Tests
- Expired token rejection
- Used token rejection
- Rate limit enforcement
- Account enumeration prevention
- Weak password rejection

## Common Mistakes to Avoid

❌ **Don't** store plaintext tokens
❌ **Don't** reveal if account exists
❌ **Don't** allow token reuse
❌ **Don't** skip expiration checks
❌ **Don't** forget to hash with server pepper

✅ **Do** use cryptographically secure random generation
✅ **Do** return uniform responses
✅ **Do** mark tokens as used after reset
✅ **Do** validate expiration server-side
✅ **Do** log all attempts for audit

## Configuration

### Required Settings
```json
{
  "PasswordReset": {
    "ServerPepper": "STRONG_RANDOM_SECRET",
    "TokenExpiryMinutes": 30,
    "RateLimitMinutes": 60,
    "RateLimitMaxAttempts": 5
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "FromEmail": "cuefinderinfo@gmail.com",
    "SmtpPassword": "app-password",
    "EnableSsl": true
  },
  "AppUrl": "https://billiardscuefinder.com"
}
```

## Database Schema

```sql
CREATE TABLE "PasswordResetTokens" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "TokenHash" VARCHAR(256) NOT NULL UNIQUE,
    "CreatedAt" TIMESTAMP DEFAULT NOW() AT TIME ZONE 'UTC',
    "ExpiresAt" TIMESTAMP NOT NULL,
    "IsUsed" BOOLEAN DEFAULT FALSE,
    "UsedAt" TIMESTAMP NULL,
    "RequestIpAddress" VARCHAR(45) NULL,
    "RequestUserAgent" VARCHAR(500) NULL,
    "Purpose" VARCHAR(50) DEFAULT 'password_reset'
);
```

## Related Files

- Service: `SolutionLibraries/CueFinder.Auth/Services/PasswordResetService.cs`
- Controller: `SolutionLibraries/CueFinder.Auth/Controllers/AuthController.cs`
- Model: `SolutionLibraries/CueFinder.Database/Models/PasswordResetToken.cs`
- Migration: `SolutionLibraries/CueFinder.Database/Migrations/20260129120000_AddPasswordResetTokenTable.cs`
- Frontend: `CueFinderFE/packages/app/src/components/ForgotPassword.jsx`
- Frontend: `CueFinderFE/packages/app/src/components/ResetPassword.jsx`

## References

- Full guide: `docs/FORGOT_PASSWORD_IMPLEMENTATION_GUIDE.md`
- Complete summary: `docs/PASSWORD_RESET_COMPLETE.md`
- Quick reference: `docs/PASSWORD_RESET_QUICK_REFERENCE.md`
