# CueFinder Password Reset - Quick Reference

## 🚀 Quick Start

### Test the Feature Locally

1. **Start Backend**
   ```powershell
   cd CueFinderBE
   dotnet run
   ```

2. **Start Frontend**
   ```powershell
   cd CueFinderFE/packages/app
   npm run dev
   ```

3. **Test Flow**
   - Navigate to http://localhost:3000/forgot-password
   - Enter test email: testuser@example.com
   - Check email for reset link
   - Complete password reset

### Run Automated Tests

```powershell
cd tests
.\test-password-reset.ps1
```

## 🔑 Key Files

### Backend
- `SolutionLibraries/CueFinder.Auth/Services/PasswordResetService.cs` - Core logic
- `SolutionLibraries/CueFinder.Auth/Controllers/AuthController.cs` - API endpoints
- `SolutionLibraries/CueFinder.Database/Models/PasswordResetToken.cs` - Data model

### Frontend
- `CueFinderFE/packages/app/src/components/ForgotPassword.jsx` - Request page
- `CueFinderFE/packages/app/src/components/ResetPassword.jsx` - Reset page

### Configuration
- `CueFinderBE/appsettings.Development.json` - Dev settings (email, DB)
- `CueFinderBE/appsettings.json` - Production template

## 📋 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/forgot-password` | POST | Request reset link |
| `/api/auth/validate-reset-token` | POST | Check token validity |
| `/api/auth/reset-password` | POST | Change password |

## ⚙️ Configuration Values

```json
{
  "PasswordReset": {
    "ServerPepper": "CHANGE_IN_PRODUCTION",
    "TokenExpiryMinutes": 30,
    "RateLimitMinutes": 60,
    "RateLimitMaxAttempts": 5
  }
}
```

## 🔒 Security Checklist

- [x] Tokens are SHA-256 hashed (never plaintext)
- [x] One-time use enforced
- [x] 30-minute expiration
- [x] Rate limiting (5 per hour)
- [x] Account enumeration prevention
- [x] Audit logging (IP, User Agent)
- [x] Password policy enforced
- [x] BCrypt password hashing

## 🐛 Common Issues

### Email not sending
- Check `EmailSettings` in appsettings.json
- Verify SMTP credentials
- Check backend logs

### Token invalid
- Tokens expire after 30 minutes
- One-time use only
- Request new reset

### Rate limit exceeded
- 5 requests per 60 minutes max
- Wait for cooldown

## 📊 Database Queries

### Check recent resets
```sql
SELECT u.Username, prt.CreatedAt, prt.IsUsed 
FROM "PasswordResetTokens" prt
JOIN "Users" u ON prt.UserId = u.Id
WHERE prt.CreatedAt > NOW() - INTERVAL '24 hours'
ORDER BY prt.CreatedAt DESC;
```

### Clean old tokens
```sql
DELETE FROM "PasswordResetTokens"
WHERE ExpiresAt < NOW();
```

## 🎯 Testing Scenarios

1. ✅ Valid email → Token sent → Password reset → Login works
2. ✅ Non-existent email → Generic message (no enumeration)
3. ✅ Expired token → Rejected with 401
4. ✅ Used token → Rejected (one-time use)
5. ✅ Weak password → Rejected with validation error
6. ✅ Mismatched passwords → Rejected
7. ✅ Rate limit → 429 after 5 requests

## 📦 Dependencies

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- BCrypt.Net
- PostgreSQL

### Frontend
- React 18
- React Router
- Axios
- react-i18next
- Tailwind CSS + shadcn/ui

## 🔗 Related Documentation

- Full implementation guide: `docs/FORGOT_PASSWORD_IMPLEMENTATION_GUIDE.md`
- Complete summary: `docs/PASSWORD_RESET_COMPLETE.md`
- Project overview: `CLAUDE.md`
- API conventions: `.claude/rules/api-conventions.md`

## 💡 Tips

- Use environment variables for sensitive config
- Monitor logs for suspicious patterns
- Clean up expired tokens periodically
- Test email flow in staging before production
- Update `ServerPepper` in production

---

**Need help?** Check the full documentation or contact the development team.
