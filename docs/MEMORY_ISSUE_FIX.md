# CRITICAL: System Out of Memory - Emergency Actions

## Immediate Actions Required:

### 1. Close Unnecessary Applications
Close all applications except VS Code:
- Web browsers (Chrome, Edge, Firefox)
- Other IDEs or development tools
- Chat applications
- Any running Docker Desktop

### 2. Restart Your Computer
Your system is critically low on memory. A restart will help clear memory.

### 3. After Restart - Check Memory
Open Task Manager (Ctrl+Shift+Esc) and check:
- Available RAM before building
- Ensure you have at least 4GB free

### 4. Alternative: Build on Server
Since your local machine is low on memory, build directly on the server:

```powershell
# SSH to server and build there
ssh cuefinder@116.203.137.201
cd app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build backend
```

### 5. Increase Virtual Memory (Pagefile)
1. Right-click "This PC" → Properties
2. Advanced system settings → Performance Settings
3. Advanced tab → Virtual Memory → Change
4. Set custom size: Initial = 8192 MB, Maximum = 16384 MB

### 6. Docker Desktop Memory Settings
If using Docker Desktop:
1. Open Docker Desktop → Settings → Resources
2. Reduce Memory allocation to 4GB or less
3. Apply & Restart

## Server Deployment Issue - Quick Fix

The server has a PostgreSQL password mismatch. Run this script on the server:

```bash
#!/bin/bash
cd /home/cuefinder/app

# Stop all containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v

# Remove old database data
sudo rm -rf /home/cuefinder/data/postgres/*

# Ensure .env file is correct
cat > .env << 'EOF'
DB_PASSWORD=CueFinderDB2024SecurePass
JWT_SECRET=CueFinderJWT2024VerySecureSecretKey256Bits
FRONTEND_API_URL=https://billiardscuefinder.com
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
EOF

# Start fresh
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Save this as `fix-deployment.sh` on the server and run: `bash fix-deployment.sh`
