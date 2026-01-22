# 🚀 Quick Start: Deploy CueFinder to Production

## ⚡ FAST TRACK (15 minutes)

### Step 1: Get SSH Private Key (2 min)
```powershell
Get-Content $env:USERPROFILE\.ssh\cuefinder_actions
```
Copy the **ENTIRE** output (including BEGIN/END lines)

---

### Step 2: Copy These Generated Values (1 min)

**Save these somewhere safe - you'll need them!**

```
SERVER_IP:
116.203.137.201

DB_PASSWORD:
qDoXyrz9RYxcsfg4iw7GElAJapHt1NI6

JWT_SECRET:
ZtviU"9<Vn>uhlFz6XC%3A12D~^H#Ej{[K;5@B/}Rxqcw)MYSkJLp$T4Na|*+brf

FRONTEND_API_URL:
https://billiardscuefinder.com/api

CORS_FRONTEND_ORIGIN:
https://billiardscuefinder.com
```

---

### Step 3: Add to GitHub (10 min)

1. Open: https://github.com/tselloss/CueFinder/settings/secrets/actions

2. Click **"New repository secret"** for each:

| Name | Value |
|------|-------|
| `SSH_PRIVATE_KEY` | Paste SSH key from Step 1 |
| `SERVER_IP` | `116.203.137.201` |
| `DB_PASSWORD` | `qDoXyrz9RYxcsfg4iw7GElAJapHt1NI6` |
| `JWT_SECRET` | `ZtviU"9<Vn>uhlFz6XC%3A12D~^H#Ej{[K;5@B/}Rxqcw)MYSkJLp$T4Na|*+brf` |
| `FRONTEND_API_URL` | `https://billiardscuefinder.com/api` |
| `CORS_FRONTEND_ORIGIN` | `https://billiardscuefinder.com` |

---

### Step 4: Deploy! (2 min)

1. Go to: https://github.com/tselloss/CueFinder/actions
2. Click **"Deploy to Production"**
3. Click **"Run workflow"** dropdown
4. Select branch: **`release`**
5. Click green **"Run workflow"** button
6. Watch it deploy! ✨

---

### Step 5: Verify (1 min)

```powershell
# Check if containers are running
ssh cuefinder@116.203.137.201 "docker ps"

# You should see:
# - cuefinder-nginx-prod (ports 80/443)
# - cuefinder-backend-prod
# - cuefinder-frontend-prod
# - cuefinder-postgres-prod
```

Access your site:
- Frontend: http://116.203.137.201
- Backend API: http://116.203.137.201/api/health

---

## 🎯 What Happens During Deployment?

1. ✅ GitHub Actions connects to your server via SSH
2. ✅ Clones/pulls latest code from `release` branch
3. ✅ Creates `.env` file with your secrets
4. ✅ Builds Docker images for backend & frontend
5. ✅ Starts all containers (nginx, backend, frontend, postgres)
6. ✅ Only exposes nginx on ports 80/443 (secure!)

---

## 🐛 Quick Troubleshooting

### ❌ Deployment fails with "Permission denied"
**Fix:** Make sure you copied the **FULL** SSH private key including BEGIN/END lines

### ❌ Containers not starting
**Check logs:**
```powershell
ssh cuefinder@116.203.137.201 "docker compose -f ~/app/docker-compose.yml -f ~/app/docker-compose.prod.yml logs"
```

### ❌ CORS errors in browser
**Fix:** Update secrets:
- If using domain, make sure DNS is pointing to server first
- If using IP, change secrets to `http://116.203.137.201` (no /api for CORS_FRONTEND_ORIGIN)

---

## 🔄 Re-deploy After Changes

1. Commit your changes:
```powershell
git add .
git commit -m "your message"
git push origin release
```

2. GitHub Actions automatically deploys! 🚀

---

## 📊 Monitor Your Application

### Check if everything is running:
```powershell
ssh cuefinder@116.203.137.201 "docker ps"
```

### View backend logs:
```powershell
ssh cuefinder@116.203.137.201 "docker logs cuefinder-backend-prod -f"
```

### View nginx logs:
```powershell
ssh cuefinder@116.203.137.201 "docker logs cuefinder-nginx-prod -f"
```

### Restart if needed:
```powershell
ssh cuefinder@116.203.137.201 "cd ~/app && docker compose -f docker-compose.yml -f docker-compose.prod.yml restart"
```

---

## ✅ Production Checklist

- [x] Backend uses Production environment
- [x] CORS only allows production domain (no localhost in prod)
- [x] Secrets removed from code (using GitHub Secrets)
- [x] Only nginx exposed on 80/443 (secure)
- [x] Database password is secure random string
- [x] JWT secret is 64-char random string
- [x] Test files with credentials removed
- [x] .env files added to .gitignore

---

## 🎉 You're Production Ready!

Your CueFinder application is now configured for secure, automated deployments!

**Next Steps:**
1. Set up SSL (Let's Encrypt) - See `deployment/setup-ssl.ps1`
2. Configure domain DNS if not done yet
3. Test your application thoroughly
4. Update secrets to use https:// URLs once SSL is set up

**Need the full guide?** See: `GITHUB_SECRETS_SETUP_COMPLETE.md`
