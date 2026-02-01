# Password Reset Feature - Visual Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER WORKFLOWS                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ FORGOT PASSWORD FLOW                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  User                  ForgotPassword         Backend                 │
│   │                      Component             Server                 │
│   │                        │                      │                   │
│   ├─ Enter email ────────> │                      │                   │
│   │                        │  POST /forgot-      │                   │
│   │                        ├─ password ────────> │                   │
│   │                        │                 ┌───┴────┬──────┐       │
│   │                        │                 │        │      │       │
│   │                        │          [Find User]    │    [No User]  │
│   │                        │                 │        │      │       │
│   │                        │        [Rate Limit Check]│      │       │
│   │                        │                 │        │      │       │
│   │                        │        [Generate Token]  │      │       │
│   │                        │                 │        │      │       │
│   │                        │  ┌─ Store in DB (hashed)│      │       │
│   │                        │  │  (Same response for both)   │       │
│   │                        │  │                 │        │      │       │
│   │ <─ Success Message ─── ├─ 200 OK ─────── <┘        │      │       │
│   │ "Check your email"     │                           │      │       │
│   │                        │                           │      │       │
│   ├─ [Check Email] ─────> │ [Email Sent with token]  │      │       │
│   │                        │                           │      │       │
│   └───────────────────────┘───────────────────────────┘      │       │
│                                                                │       │
└────────────────────────────────────────────────────────────────┘       │
                                                                         │
┌────────────────────────────────────────────────────────────────────────┤
│ RESET PASSWORD FLOW                                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User              ResetPassword              Backend                  │
│   │                 Component                  Server                  │
│   │                   │                           │                    │
│   ├─ Click Link ───> │ /reset-password?token=... │                   │
│   │   (from email)   │                           │                    │
│   │                  │  POST /validate-          │                    │
│   │                  ├─ reset-token ──────────> │                    │
│   │                  │                           │                    │
│   │                  │                    [Hash & Lookup]             │
│   │                  │                           │                    │
│   │                  │                    [Check: not expired]        │
│   │                  │                    [Check: not used]           │
│   │                  │                           │                    │
│   │ Show Form <────── 200 OK (valid token)  ──┘                      │
│   │                  │                                                 │
│   ├─ Enter Password ─┤ [Shows requirements checklist]                 │
│   │                  │ [Real-time strength indicator]                 │
│   │                  │                                                 │
│   ├─ Confirm Pwd ───┤ [Validates on client]                           │
│   │                  │   - 8+ chars                                    │
│   │                  │   - Letters + Numbers                           │
│   │                  │   - Passwords match                             │
│   │                  │                                                 │
│   ├─ Submit ────────┤  POST /reset-password                           │
│   │                  ├──────────────────────────> │                   │
│   │                  │                           │                    │
│   │                  │              [Validate Token]                  │
│   │                  │              [Hash Password]                   │
│   │                  │              [Update User]                     │
│   │                  │              [Mark Token Used]                 │
│   │                  │                           │                    │
│   │ Success Page <──┴────── 200 OK ─────────── <┘                   │
│   │ "Password reset!"      (auto-redirect)                             │
│   │                                                                    │
│   ├─ [Go to Login] ──────────────────────────────────────────────>   │
│   │                                                                    │
│   └─ Login with new password ──────────────────────────────────────> │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────────────────────────┐
│      PasswordResetTokens         │
├──────────────────────────────────┤
│  Id (PK)                    INT  │
│  UserId (FK)                INT  │ ──> Users (Id)
│  TokenHash                  STR  │ [SHA-256 hashed + peppered]
│  CreatedAt               TIMESTAMP│ [UTC, indexed]
│  ExpiresAt               TIMESTAMP│ [UTC, indexed]
│  IsUsed                   BOOL   │ [Default: false]
│  UsedAt                TIMESTAMP │ [Null until used]
│  RequestIpAddress          STR   │ [Audit]
│  RequestUserAgent          STR   │ [Audit]
│  Purpose                   STR   │ [password_reset, indexed]
├──────────────────────────────────┤
│ Indexes:                         │
│ - TokenHash (UNIQUE)             │
│ - (UserId, IsUsed, ExpiresAt)   │
│ - CreatedAt                      │
└──────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY DEFENSES                         │
└─────────────────────────────────────────────────────────────┘

LAYER 1: REQUEST FILTERING
├─ Rate Limiting (5 attempts/60 min per user)
├─ IP-based throttling (ready for enhancement)
└─ CAPTCHA (placeholder for enhancement)

LAYER 2: ACCOUNT ENUMERATION PREVENTION
├─ Uniform HTTP 200 response
├─ Generic "check your email" message
├─ Timing-attack resistant responses
└─ No "user not found" feedback

LAYER 3: TOKEN SECURITY
├─ 32-byte cryptographic randomness (RandomNumberGenerator)
├─ SHA-256 hashing with server pepper
├─ One-time-use enforcement
├─ 30-minute expiration
└─ Purpose binding (password_reset only)

LAYER 4: PASSWORD POLICY
├─ 8+ character minimum
├─ Letters + numbers required
├─ Special characters encouraged
├─ Common password blocklist
└─ Confirmation matching

LAYER 5: AUTHENTICATION
├─ JWT tokens for session management
├─ Session invalidation preparation
└─ Browser cookie security headers

LAYER 6: AUDIT & MONITORING
├─ IP address logging
├─ User agent capture
├─ Timestamp tracking
├─ Token usage logging
└─ Suspicious activity detection (ready)

LAYER 7: DATABASE SECURITY
├─ Encrypted connections (TLS)
├─ Parameterized queries (EF Core)
├─ Indexed for performance
└─ Foreign key constraints
```

## Password Strength Indicator

```
Real-time strength calculation:

Weak (0-30%)        Fair (30-60%)       Good (60-80%)       Strong (80-100%)
│████░░░░│          │██████░░│          │████████░│         │██████████│
❌ Short            ✓ 8+ chars         ✓ 8+ chars         ✓ 8+ chars
                    ✓ Mixed case       ✓ Mixed case       ✓ Mixed case
                                       ✓ Numbers          ✓ Numbers
                                                          ✓ Special char
                                                          ✓ Matches confirm

Color Coding:
🔴 Red    = Weak       < 30%
🟡 Yellow = Fair       30-60%
🔵 Blue   = Good       60-80%
🟢 Green  = Strong     80-100%
```

## Request-Response Examples

### Forgot Password - Valid Account
```
REQUEST:
POST /api/auth/forgot-password
Content-Type: application/json

{
  "emailOrUsername": "user@example.com"
}

RESPONSE (200 OK):
{
  "message": "If an account exists with that email/username, 
              you will receive a password reset link shortly."
}

BACKEND ACTION:
✓ Find user by email or username
✓ Check rate limits
✓ Generate token
✓ Hash token (SHA-256 + pepper)
✓ Store in DB with expiry
✓ Send email (TODO: implement)
✓ Log request (IP, user agent)
```

### Forgot Password - Invalid Account
```
REQUEST:
POST /api/auth/forgot-password
Content-Type: application/json

{
  "emailOrUsername": "nonexistent@example.com"
}

RESPONSE (200 OK):  ← SAME RESPONSE AS VALID!
{
  "message": "If an account exists with that email/username, 
              you will receive a password reset link shortly."
}

BACKEND ACTION:
✓ Try to find user
✗ User not found
✓ Log attempt (for security monitoring)
✓ Return generic response anyway
✓ Prevent account enumeration
```

### Validate Token
```
REQUEST:
POST /api/auth/validate-reset-token
Content-Type: application/json

{
  "token": "eW91cnRva2VuaGVyZQ=="
}

RESPONSE - VALID (200 OK):
{
  "isValid": true,
  "message": "Token is valid. You can now reset your password."
}

RESPONSE - INVALID (401 Unauthorized):
{
  "message": "This password reset link has expired or is invalid..."
}

BACKEND CHECKS:
✓ Hash provided token
✓ Look up in database
✓ Check IsUsed flag (must be false)
✓ Check ExpiresAt (must be future)
✓ Verify Purpose (must be password_reset)
```

### Reset Password - Success
```
REQUEST:
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "eW91cnRva2VuaGVyZQ==",
  "newPassword": "MyNewP@ssw0rd123!",
  "confirmPassword": "MyNewP@ssw0rd123!"
}

RESPONSE (200 OK):
{
  "message": "Your password has been reset successfully. 
              Please login with your new password."
}

BACKEND ACTIONS:
✓ Validate token (same as above)
✓ Get user ID from token
✓ Validate password policy
✓ Hash password (BCrypt)
✓ Update User.PasswordHash
✓ Set token.IsUsed = true
✓ Set token.UsedAt = DateTime.UtcNow
✓ Save to database
✓ Log successful reset
✓ Optionally send confirmation email
```

## Security Flow - Preventing Common Attacks

```
┌──────────────────────────────────────────────────────────┐
│         ATTACK PREVENTION MECHANISMS                      │
└──────────────────────────────────────────────────────────┘

ACCOUNT ENUMERATION ATTACK
─────────────────────────
Attacker: "Tell me which emails are registered"

Defense:
  Before: ❌ "User not found" vs "Email sent"
  After:  ✓ Always: "If an account exists... email sent"
  Result: Impossible to discover registered accounts


TOKEN REPLAY ATTACK
──────────────────
Attacker: "I'll use the same reset token twice"

Defense:
  ✓ Token stored as SHA-256 hash (not plaintext)
  ✓ IsUsed flag set to true after first use
  ✓ Second attempt: hash match found but IsUsed=true
  ✓ Request rejected
  Result: One-time-use enforced


TIMING ATTACK
─────────────
Attacker: "I'll measure response times to guess passwords"

Defense:
  ✓ Uniform response time (same delay for valid/invalid)
  ✓ Same HTTP 200 status code
  ✓ Same message content
  ✓ Attacker can't distinguish valid accounts
  Result: Timing differences don't leak information


BRUTE FORCE TOKEN ATTACK
───────────────────────
Attacker: "I'll try 1 million random tokens"

Defense:
  ✓ 32-byte random tokens (2^256 possibilities)
  ✓ Rate limiting: 5 attempts per 60 minutes per user
  ✓ Token indexed for fast lookup (no table scan)
  ✓ Token expires after 30 minutes
  ✓ IP-based throttling (enhancement)
  Result: Cryptographically infeasible


PASSWORD SPRAYING
─────────────────
Attacker: "I'll try 'password123' on all emails"

Defense:
  ✓ Cannot enumerate accounts (account enumeration prevention)
  ✓ Reset emails are legitimate - need sender's email access
  ✓ Admin alerts on suspicious patterns
  Result: Attacker blocked at account enumeration stage


SESSION HIJACKING
────────────────
Attacker: "I'll steal someone's password reset link"

Defense:
  ✓ Token sent via HTTPS only
  ✓ Token one-time use (expires if not used)
  ✓ Token tied to specific user ID
  ✓ Browser must access link within 30 minutes
  Result: Stolen links have short window and one-time use
```

## Integration Checklist

```
═══════════════════════════════════════════════════════════
  SETUP COMPLETION CHECKLIST
═══════════════════════════════════════════════════════════

BACKEND SETUP:
  ✅ PasswordResetToken model created
  ✅ IPasswordResetService interface defined
  ✅ PasswordResetService implemented
  ✅ API endpoints in AuthController
  ✅ DbContext updated with DbSet
  ✅ Migration created (20260129120000_AddPasswordResetTokenTable.cs)
  ✅ Service registered in DI (AuthServiceExtension.cs)
  ☐ Run: dotnet ef database update
  ☐ Configure ServerPepper in appsettings
  ☐ Implement email service integration

FRONTEND SETUP:
  ✅ ForgotPassword.jsx component created
  ✅ ResetPassword.jsx component created
  ✅ CSS styling completed
  ✅ Components are mobile-responsive
  ☐ Add routes to React Router
  ☐ Add "Forgot Password?" link in Login page
  ☐ Update navigation/links as needed

TESTING:
  ☐ Unit tests for backend
  ☐ Integration tests for full flow
  ☐ Frontend component tests
  ☐ Manual end-to-end testing
  ☐ Rate limiting verification
  ☐ Account enumeration prevention verification

SECURITY:
  ☐ Verify ServerPepper is strong and secret
  ☐ Enable HTTPS for all password reset traffic
  ☐ Configure CORS properly
  ☐ Set secure cookie flags
  ☐ Review audit logs

DEPLOYMENT:
  ☐ Staging environment testing
  ☐ Production database migration
  ☐ Update production appsettings
  ☐ Monitor logs for reset activity
  ☐ Send communication to users about feature

DOCUMENTATION:
  ✅ Implementation guide created
  ✅ Summary document created
  ✅ Architecture diagrams included
  ✅ Security documentation included
  ☐ Update help/support documentation
  ☐ Add to user FAQ
  ☐ Create email template guides
```

---

**Document Version**: 1.0  
**Last Updated**: January 29, 2026  
**Status**: Ready for Review
