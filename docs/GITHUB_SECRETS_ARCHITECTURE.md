# Production Email Secrets Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     GITHUB REPOSITORY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Secrets (Encrypted Storage)                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SMTP_PASSWORD          (hidden)                           │ │
│  │ EMAIL_FROM             cuefinderinfo@gmail.com            │ │
│  │ SMTP_SERVER            smtp.gmail.com                     │ │
│  │ SMTP_PORT              587                                │ │
│  │ GMAIL_CLIENT_ID        1084511442650-...                 │ │
│  │ GMAIL_CLIENT_SECRET    (hidden)                           │ │
│  │ GMAIL_PROJECT_ID       cuefinder                          │ │
│  │ [plus other secrets]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                       │
│                  (triggered by push/manual)                       │
│                                                                   │
│  GitHub Actions Workflow (.github/workflows/deploy-backend.yml)  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Checkout code                                           │ │
│  │ 2. Test backend                                            │ │
│  │ 3. Read secrets from encrypted storage                     │ │
│  │ 4. Create deployment script with secrets                   │ │
│  │    env:                                                    │ │
│  │      SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}          │ │
│  │      EMAIL_FROM: ${{ secrets.EMAIL_FROM }}                │ │
│  │      GMAIL_CLIENT_SECRET: ${{ secrets.GMAIL_CLIENT_... }} │ │
│  │      (etc.)                                                │ │
│  │ 5. Connect to server via SSH                              │ │
│  │ 6. Execute deployment script                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ SSH Connection
                             ↓
        ┌────────────────────────────────────────┐
        │   PRODUCTION SERVER                    │
        ├────────────────────────────────────────┤
        │                                        │
        │  /home/cuefinder/app/                  │
        │  ┌────────────────────────────────┐   │
        │  │ .env (Environment File)        │   │
        │  ├────────────────────────────────┤   │
        │  │ DB_PASSWORD=***                │   │
        │  │ JWT_SECRET=***                 │   │
        │  │ SMTP_PASSWORD=***              │   │
        │  │ SMTP_SERVER=smtp.gmail.com     │   │
        │  │ SMTP_PORT=587                  │   │
        │  │ EMAIL_FROM=cuefinderinfo@...   │   │
        │  │ GMAIL_CLIENT_ID=1084511442... │   │
        │  │ GMAIL_CLIENT_SECRET=***        │   │
        │  └────────────────────────────────┘   │
        │              ↓                        │
        │  ┌────────────────────────────────┐   │
        │  │ docker-compose.prod.yml        │   │
        │  │ (loads .env file)              │   │
        │  └────────────────────────────────┘   │
        │              ↓                        │
        │  ┌────────────────────────────────┐   │
        │  │ Docker Container               │   │
        │  │ cuefinder-backend-prod         │   │
        │  ├────────────────────────────────┤   │
        │  │ Environment Variables:         │   │
        │  │ - EmailSettings__SmtpServer    │   │
        │  │ - EmailSettings__SmtpPort      │   │
        │  │ - EmailSettings__SmtpPassword  │   │
        │  │ - EmailSettings__FromEmail     │   │
        │  │ - GmailApi__ClientId           │   │
        │  │ - GmailApi__ClientSecret       │   │
        │  │ - (all from .env)              │   │
        │  └────────────────────────────────┘   │
        │              ↓                        │
        │  ┌────────────────────────────────┐   │
        │  │ ASP.NET Configuration Reader   │   │
        │  ├────────────────────────────────┤   │
        │  │ appsettings.Production.json    │   │
        │  │     + Environment Variables    │   │
        │  │     = Final Config             │   │
        │  └────────────────────────────────┘   │
        │              ↓                        │
        │  ┌────────────────────────────────┐   │
        │  │ Email Services Ready:          │   │
        │  │ ✅ SMTP (EmailService)         │   │
        │  │ ✅ Gmail API (GmailApiEmail..) │   │
        │  └────────────────────────────────┘   │
        │                                       │
        └───────────────────────────────────────┘
                      ↓
        ┌────────────────────────────────────────┐
        │   USER INITIATES PASSWORD RESET        │
        ├────────────────────────────────────────┤
        │                                        │
        │  1. User submits email at frontend     │
        │                                        │
        │  2. Backend /api/auth/forgot-password  │
        │     POST {emailOrUsername}             │
        │                                        │
        │  3. AuthController:                    │
        │     - Validates user                   │
        │     - Generates reset token            │
        │     - Checks rate limits               │
        │                                        │
        │  4. Sends email via IEmailService      │
        │     (uses config from environment)     │
        │                                        │
        │  5. EmailService.SendAsync():          │
        │     - Reads EmailSettings from config  │
        │     - Uses SMTP_PASSWORD secret        │
        │     - Sends via smtp.gmail.com:587     │
        │                                        │
        │  6. Email delivered to user! ✅        │
        │     Subject: "Reset Your CueFinder..." │
        │     From: cuefinderinfo@gmail.com      │
        │                                        │
        └────────────────────────────────────────┘
```

## Data Flow: Secret → Container → Email

```
GitHub Secret (encrypted)
    │
    ├─ Only readable by: GitHub Actions runner
    ├─ Automatically redacted in logs
    ├─ Never stored in plain text in repo
    │
    └─→ Environment Variable in GitHub Actions
        │
        ├─ ${{ secrets.SMTP_PASSWORD }}
        ├─ ${{ secrets.GMAIL_CLIENT_SECRET }}
        │
        └─→ Embedded in Deploy Script
            │
            └─→ Written to .env File (on server)
                │
                ├─ /home/cuefinder/app/.env
                ├─ File permissions: -rw------- (only owner can read)
                │
                └─→ Loaded by docker-compose.prod.yml
                    │
                    ├─ environment:
                    │   - EmailSettings__SmtpPassword=${SMTP_PASSWORD}
                    │
                    └─→ Docker Container Environment
                        │
                        └─→ ASP.NET Configuration Binding
                            │
                            └─→ Injected into EmailService
                                │
                                └─→ Used for SMTP Authentication
                                    │
                                    └─→ Email Sent! ✅
```

## Security Checkpoints

```
┌─────────────────────────────────────────────────────────────────┐
│ Security Layer 1: GitHub                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Secrets encrypted at rest (GitHub encryption)                │
│ ✅ Masked in logs (${{ secrets.X }} → ***)                      │
│ ✅ Only accessible to Actions in this repo                      │
│ ✅ Audit log of secret access                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Security Layer 2: Transit (GitHub Actions to Server)            │
├─────────────────────────────────────────────────────────────────┤
│ ✅ SSH connection (encrypted tunnel)                            │
│ ✅ SSH key authentication (no password)                         │
│ ✅ Secrets embedded in deployment script                        │
│ ✅ Script uploaded via SCP (encrypted)                          │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Security Layer 3: Server                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✅ .env file: owner read-only (chmod 600)                       │
│ ✅ Only container process can read                              │
│ ✅ Not logged by default                                        │
│ ✅ Never committed to git                                       │
│ ✅ Added to .gitignore                                          │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Security Layer 4: Application                                   │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Loaded as environment variables (memory only)                │
│ ✅ Bound to IOptions<EmailSettings> (configuration)             │
│ ✅ Only accessible to email service                             │
│ ✅ Never logged to files                                        │
│ ✅ Encrypted transmission to Gmail (TLS 1.2+)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variable Naming Convention

```
GitHub Secret          Docker .env           ASP.NET Config
─────────────────────────────────────────────────────────────
SMTP_PASSWORD      →  SMTP_PASSWORD       →  EmailSettings:SmtpPassword
SMTP_SERVER        →  SMTP_SERVER         →  EmailSettings:SmtpServer
SMTP_PORT          →  SMTP_PORT           →  EmailSettings:SmtpPort
EMAIL_FROM         →  EMAIL_FROM          →  EmailSettings:FromEmail
GMAIL_CLIENT_ID    →  GMAIL_CLIENT_ID     →  GmailApi:ClientId
GMAIL_CLIENT_SECRET→  GMAIL_CLIENT_SECRET →  GmailApi:ClientSecret

Docker compose maps to ASP.NET using __notation:
  - EmailSettings__SmtpPassword
  - GmailApi__ClientSecret
```

## Testing the Flow

```
1. Verify .env exists on server:
   $ ssh user@server
   $ cat /home/cuefinder/app/.env | grep SMTP
   SMTP_PASSWORD=abcd efgh ijkl mnop
   SMTP_SERVER=smtp.gmail.com
   ✅ Secrets deployed!

2. Verify container has environment:
   $ docker exec cuefinder-backend-prod env | grep -i smtp
   EmailSettings__SmtpServer=smtp.gmail.com
   EmailSettings__SmtpPassword=abcd efgh ijkl mnop
   ✅ Container loaded!

3. Test password reset endpoint:
   $ curl -X POST https://billiardscuefinder.com/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"emailOrUsername":"user@example.com"}'
   
   Response: 200 OK
   "If an account exists..."
   ✅ Email sent!

4. Check backend logs:
   $ docker logs cuefinder-backend-prod | grep -i "email\|smtp"
   "Email sent successfully to user@example.com"
   ✅ Confirmed!
```

## Troubleshooting Flow

```
Email not working?
│
├─ Check 1: Secret Set in GitHub?
│  $ Go to Settings → Secrets and variables
│  $ Look for SMTP_PASSWORD secret
│  ✅ If missing: Add it
│
├─ Check 2: Secret in .env on Server?
│  $ ssh user@server
│  $ cat /home/cuefinder/app/.env | grep SMTP
│  ✅ If empty: Re-deploy
│
├─ Check 3: Container Has Environment?
│  $ docker exec cuefinder-backend-prod env | grep SMTP
│  ✅ If missing: Check docker-compose.prod.yml
│
├─ Check 4: Application Logs?
│  $ docker logs cuefinder-backend-prod
│  ✅ Look for "Email sent" or error messages
│
└─ Check 5: Gmail App Password Valid?
   $ Go to myaccount.google.com/apppasswords
   $ Verify password not revoked
   $ Generate new if needed
   $ Update SMTP_PASSWORD secret
```

## Summary

**Secrets Path**: GitHub → GitHub Actions → SSH → Server .env → Docker → App

**Security**: Multiple encryption layers + access controls + audit trails

**Email Flow**: User Request → Reset Token → Email Service → SMTP (using secret) → Gmail → Inbox

