# 🔐 Complete GitHub Secrets Setup Guide

## Overview
This guide will walk you through setting up all required GitHub Secrets for automated deployment.

---

## ✅ What We Fixed (Production Ready)

### Code Changes:
- ✅ **Backend Dockerfile**: Changed `ASPNETCORE_ENVIRONMENT` from `Development` to `Production`
- ✅ **Program.cs CORS**: Localhost origins only added in Development mode
- ✅ **appsettings.json**: Removed hardcoded passwords and secrets
- ✅ **test-register.json**: Removed file with real credentials
- ✅ **.env.production**: Sanitized to use placeholders
- ✅ **deployment scripts**: All hardcoded secrets replaced with placeholders
- ✅ **.gitignore**: Added entries for .env files, test files, and logs

---

## 📋 Required GitHub Secrets

You need to set **6 secrets** in your GitHub repository.

### How to Access GitHub Secrets:
1. Go to: https://github.com/tselloss/CueFinder/settings/secrets/actions
2. Click **"New repository secret"** for each secret below

---

## 🔑 Secret #1: SSH_PRIVATE_KEY

**What it's for:** Allows GitHub Actions to SSH into your server and deploy.

**Get the value:**
```powershell
Get-Content $env:USERPROFILE\.ssh\cuefinder_actions
```

**Steps:**
1. Run the command above in PowerShell
2. Copy the **ENTIRE** output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
3. In GitHub:
   - **Name:** `SSH_PRIVATE_KEY`
   - **Secret:** Paste the entire private key
4. Click **"Add secret"**

---

## 🌐 Secret #2: SERVER_IP

**What it's for:** Your production server IP address.

**Value:**
```
116.203.137.201
```

**Steps:**
1. In GitHub:
   - **Name:** `SERVER_IP`
   - **Secret:** `116.203.137.201`
2. Click **"Add secret"**

---

## 🔒 Secret #3: DB_PASSWORD

**What it's for:** PostgreSQL database password for production.

**Generate a secure password:**
```powershell
$dbPass = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$dbPass
```

**Steps:**
1. Run the command above in PowerShell
2. **COPY THE OUTPUT** (you'll need it!)
3. In GitHub:
   - **Name:** `DB_PASSWORD`
   - **Secret:** Paste the generated password
4. Click **"Add secret"**

**⚠️ IMPORTANT:** Save this password somewhere safe! You'll need it if you ever want to connect to the database manually.

---

## 🔐 Secret #4: JWT_SECRET

**What it's for:** Secret key for JWT token signing (user authentication).

**Generate a secure JWT secret:**
```powershell
$jwtSecret = -join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$jwtSecret
```

**Steps:**
1. Run the command above in PowerShell
2. **COPY THE OUTPUT**
3. In GitHub:
   - **Name:** `JWT_SECRET`
   - **Secret:** Paste the generated secret
4. Click **"Add secret"**

---

## 🌍 Secret #5: FRONTEND_API_URL

**What it's for:** The URL your frontend will use to call the backend API.

**For domain (recommended):**
```
https://billiardscuefinder.com/api
```

**For IP-only testing:**
```
http://116.203.137.201/api
```

**Steps:**
1. Choose based on whether you have DNS configured yet
2. In GitHub:
   - **Name:** `FRONTEND_API_URL`
   - **Secret:** (paste your chosen URL)
3. Click **"Add secret"**

---

## 🔗 Secret #6: CORS_FRONTEND_ORIGIN

**What it's for:** Allowed origin for CORS (security - prevents other sites from calling your API).

**For domain (recommended):**
```
https://billiardscuefinder.com
```

**For IP-only testing:**
```
http://116.203.137.201
```

**Steps:**
1. Use the same choice as FRONTEND_API_URL (but without `/api`)
2. In GitHub:
   - **Name:** `CORS_FRONTEND_ORIGIN`
   - **Secret:** (paste your chosen origin)
3. Click **"Add secret"**

---

## ✅ Verification Checklist

After adding all secrets, verify on GitHub:
https://github.com/tselloss/CueFinder/settings/secrets/actions

You should see **6 secrets**:
- [ ] `SSH_PRIVATE_KEY` - Updated ...
- [ ] `SERVER_IP` - Updated ...
- [ ] `DB_PASSWORD` - Updated ...
- [ ] `JWT_SECRET` - Updated ...
- [ ] `FRONTEND_API_URL` - Updated ...
- [ ] `CORS_FRONTEND_ORIGIN` - Updated ...

---

## 🚀 Deploy Your Application

### Option 1: Manual Trigger (Recommended for First Deploy)

1. Go to: https://github.com/tselloss/CueFinder/actions
2. Click **"Deploy to Production"** workflow
3. Click **"Run workflow"** dropdown
4. Select branch: **`release`**
5. Click **"Run workflow"** button
6. Watch the deployment logs in real-time

### Option 2: Automatic Deploy (Push to release branch)

1. Commit your code changes:
   ```powershell
   git add .
   git commit -m "feat: production-ready configuration"
   ```

2. Push to release branch:
   ```powershell
   git push origin release
   ```

3. GitHub Actions will automatically deploy!

---

## 🔍 Monitor Deployment

While deployment is running, you can:

1. **Watch GitHub Actions logs:**
   - https://github.com/tselloss/CueFinder/actions

2. **SSH into server to check containers:**
   ```powershell
   ssh cuefinder@116.203.137.201 "docker ps"
   ```

3. **Check backend logs:**
   ```powershell
   ssh cuefinder@116.203.137.201 "docker logs cuefinder-backend-prod -f"
   ```

4. **Check nginx logs:**
   ```powershell
   ssh cuefinder@116.203.137.201 "docker logs cuefinder-nginx-prod -f"
   ```

---

## 🌐 Access Your Application

### If using IP:
- **Frontend:** http://116.203.137.201
- **Backend API:** http://116.203.137.201/api
- **Health Check:** http://116.203.137.201/api/health

### If using domain:
- **Frontend:** https://billiardscuefinder.com
- **Backend API:** https://billiardscuefinder.com/api
- **Health Check:** https://billiardscuefinder.com/api/health

---

## 🐛 Troubleshooting

### Deployment fails with "Permission denied (publickey)"
- Make sure you added the correct SSH private key
- The key in GitHub Secrets should match the public key on the server

### Containers don't start
```powershell
# Check logs
ssh cuefinder@116.203.137.201 "cd ~/app && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs"
```

### CORS errors in browser
- Make sure `CORS_FRONTEND_ORIGIN` matches your actual frontend URL
- Check backend logs: `docker logs cuefinder-backend-prod`

### Database connection errors
- Verify `DB_PASSWORD` secret is set correctly
- Check PostgreSQL logs: `docker logs cuefinder-postgres-prod`

---

## 📝 Next Steps

After successful deployment:

1. **Set up DNS** (if not done yet):
   - Point `billiardscuefinder.com` A record to `116.203.137.201`
   - Point `www.billiardscuefinder.com` CNAME to `billiardscuefinder.com`

2. **Set up SSL/HTTPS**:
   - Run: `.\deployment\setup-ssl.ps1 -Domain billiardscuefinder.com`

3. **Test your application**:
   - Register a user
   - Test cue/case listings
   - Verify image uploads

4. **Update secrets if you set up domain**:
   - Update `FRONTEND_API_URL` to `https://billiardscuefinder.com/api`
   - Update `CORS_FRONTEND_ORIGIN` to `https://billiardscuefinder.com`
   - Re-run deployment

---

## 🎉 You're Done!

Your application is now configured for production deployment via GitHub Actions!

Need help? Check the logs or reach out for support.
