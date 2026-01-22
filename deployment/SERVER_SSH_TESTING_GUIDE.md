# Running Security Tests on Production Server (SSH)

## 🔍 Current Situation

Your production server at `116.203.137.201` has:
- ✅ Backend running and healthy (internally)
- ✅ Docker containers operational
- ❌ Port 5000 not accessible from outside (firewall/security)
- ❌ Node.js not installed on server
- ⚠️  All security test requests timing out because port 5000 is blocked externally

## 🎯 Solution: Run Tests ON the Server

Since the backend is only accessible internally (localhost), you need to run the security tests directly on the server.

---

## 📋 Option 1: Automated Setup (Recommended)

### Step 1: Copy files to server
```powershell
# From your local machine
scp -r tests/SecurityTests cuefinder@116.203.137.201:/home/cuefinder/app/tests/
scp deployment/setup-server-security-tests.sh cuefinder@116.203.137.201:/home/cuefinder/
```

### Step 2: SSH into server
```powershell
ssh cuefinder@116.203.137.201
```

### Step 3: Run setup script
```bash
chmod +x /home/cuefinder/setup-server-security-tests.sh
./setup-server-security-tests.sh
```

**This will:**
1. Install Node.js 20 (requires sudo password once)
2. Install npm dependencies
3. Run security tests against http://localhost:5000
4. Show test results

---

## 📋 Option 2: Manual Setup

### Step 1: SSH into server
```powershell
ssh cuefinder@116.203.137.201
```

### Step 2: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x
```

### Step 3: Copy test files (if not already there)
```bash
# On your local machine (new terminal)
cd C:\Users\karac\source\repos\CueFinder
scp -r tests/SecurityTests cuefinder@116.203.137.201:/home/cuefinder/app/tests/
```

### Step 4: Install test dependencies
```bash
# Back on server SSH session
cd /home/cuefinder/app/tests/SecurityTests
npm install
```

### Step 5: Run tests
```bash
# Test against localhost (internal access)
node api-security-tests.js

# Or with explicit URL
API_URL=http://localhost:5000 node api-security-tests.js
```

---

## 🔍 Why This Approach?

### Current Server Configuration:
```
Internet → [Firewall] → Server (116.203.137.201)
                         ├─ nginx:80,443 ✅ (publicly accessible)
                         ├─ backend:5000 ❌ (localhost only)
                         ├─ frontend:3000 ❌ (localhost only)
                         └─ postgres:5432 ❌ (localhost only)
```

**Security by design:** Only nginx (ports 80/443) is exposed to the internet. All other services are internal only.

### Testing Options:

**❌ From your machine → Server backend:5000**
- **Blocked** by firewall
- Result: Connection timeout

**✅ On server → localhost:5000**
- **Direct access** to backend
- Result: Fast, accurate tests

**✅ From your machine → https://billiardscuefinder.com/api**
- **Through nginx** proxy
- Result: Tests full production stack

---

## 🚀 Quick Commands

### Check backend health (on server)
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

### Check Docker containers
```bash
cd /home/cuefinder/app
docker compose ps
```

### View backend logs
```bash
cd /home/cuefinder/app
docker compose logs backend --tail 50
```

### Run specific test
```bash
cd /home/cuefinder/app/tests/SecurityTests
node api-security-tests.js
```

### View test results
```bash
cd /home/cuefinder/app/tests/SecurityTests
cat security-report-*.json | tail -1 | jq
```

---

## 🔧 Troubleshooting

### Issue: "node: command not found"
**Solution:** Install Node.js (see Step 2 in Manual Setup)

### Issue: "npm: command not found"
**Solution:** Node.js installation includes npm automatically

### Issue: Tests still timing out
**Check:**
```bash
# Is backend running?
docker compose ps backend

# Is backend healthy?
curl http://localhost:5000/health

# Are rate limits configured?
grep "UseRateLimiting" CueFinderBE/Program.cs
```

### Issue: "Cannot find module 'axios'"
**Solution:**
```bash
cd /home/cuefinder/app/tests/SecurityTests
npm install
```

---

## 📊 Expected Test Duration

**On Server (localhost access):**
- With rate limiting: ~3 minutes
- Without rate limiting: ~30 seconds

**From External (if port were open):**
- Would be same, but port is blocked for security

---

## 🔒 Security Considerations

### Why is port 5000 blocked?

**Good security practice:**
- ✅ Only expose necessary ports (80, 443)
- ✅ Backend behind nginx reverse proxy
- ✅ Rate limiting at application level
- ✅ SSL termination at nginx
- ✅ No direct database access from internet

### Should you open port 5000?

**NO!** Keep it blocked. Instead:
1. Run tests ON the server (localhost)
2. Or test through nginx: https://billiardscuefinder.com/api
3. Use SSH tunneling if needed (see below)

---

## 🌐 Alternative: SSH Tunnel (Advanced)

If you want to test from your machine without changing firewall rules:

### Create SSH tunnel
```powershell
# On your local machine
ssh -L 5000:localhost:5000 cuefinder@116.203.137.201 -N
```

### Run tests (in new terminal)
```powershell
# Tests will connect to localhost:5000 on your machine
# Which tunnels to localhost:5000 on server
cd tests\SecurityTests
node api-security-tests.js
```

**Advantage:** Test from your machine, no firewall changes
**Disadvantage:** Requires keeping SSH connection open

---

## ✅ Recommended Workflow

### 1. Initial Setup (Once)
```bash
# SSH to server
ssh cuefinder@116.203.137.201

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install test dependencies
cd /home/cuefinder/app/tests/SecurityTests
npm install
```

### 2. Regular Testing
```bash
# SSH to server
ssh cuefinder@116.203.137.201

# Run tests
cd /home/cuefinder/app/tests/SecurityTests
node api-security-tests.js

# View results
cat security-report-*.json | tail -1 | jq '.summary'
```

### 3. After Code Changes
```bash
# Pull latest code
cd /home/cuefinder/app
git pull

# Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Wait for backend to start
sleep 15

# Run tests
cd tests/SecurityTests
node api-security-tests.js
```

---

## 📞 Support

If you need help:
1. Check backend is running: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Test health endpoint: `curl http://localhost:5000/health`
4. Verify Node.js: `node --version`

---

**Next Step:** SSH into your server and follow Option 1 or Option 2 above! 🚀
