# GitHub Secrets Setup Guide

To enable automated deployment with GitHub Actions, you need to configure the following secrets in your GitHub repository.

## How to Add Secrets

1. Go to your repository on GitHub: `https://github.com/tselloss/CueFinder`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below:

## Required Secrets

### 1. SSH_PRIVATE_KEY
Your private SSH key for connecting to the server.

**To get the value:**
```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa
```

Copy the **entire output** (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### 2. SERVER_IP
Your Hetzner server IP address.

**Value:**
```
116.203.137.201
```

### 3. DB_PASSWORD
PostgreSQL database password for production.

**Value:** (Generate a strong password)
```powershell
# Generate a random password
-join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 4. JWT_SECRET
Secret key for JWT token signing.

**Value:** (Generate a random secret)
```powershell
# Generate a random JWT secret
-join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### 5. FRONTEND_API_URL
The API URL that the frontend will use.

**Value:**
```
http://116.203.137.201:5000
```
(Or use your domain if you have one configured)

## After Adding Secrets

1. Commit and push the `.github/workflows/deploy-production.yml` file
2. The workflow will run automatically on push to `main` or `master` branch
3. Or manually trigger it from: **Actions** → **Deploy to Production** → **Run workflow**

## Testing the Workflow

You can manually trigger a deployment:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch (main/master)
5. Click **Run workflow** button

The deployment will execute and you can view logs in real-time.

## Local Testing (Without GitHub Actions)

If you want to deploy manually from your local machine:

```powershell
.\deployment\deploy-to-hetzner.ps1 -ServerIP 116.203.137.201
```
