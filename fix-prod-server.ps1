#!/usr/bin/env pwsh
# Quick fix for production server - Run this to fix the database authentication

Write-Host "🔧 Fixing production server database authentication..." -ForegroundColor Cyan

# Step 1: Reset postgres password to match .env
Write-Host "`n1️⃣  Resetting postgres password..." -ForegroundColor Yellow
ssh cuefinder@116.203.137.201 @'
docker exec -u postgres cuefinder-postgres-prod psql -d postgres -c "ALTER USER postgres WITH PASSWORD 'qDoXyrz9RYxcsfg4iw7GElAJapHt1NI6';"
'@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Password reset successful" -ForegroundColor Green
} else {
    Write-Host "❌ Password reset failed - trying alternative method..." -ForegroundColor Red
    ssh cuefinder@116.203.137.201 "docker exec cuefinder-postgres-prod psql -U postgres -d postgres -c \"ALTER USER postgres WITH PASSWORD 'qDoXyrz9RYxcsfg4iw7GElAJapHt1NI6';\""
}

# Step 2: Pull latest code
Write-Host "`n2️⃣  Pulling latest release code..." -ForegroundColor Yellow
ssh cuefinder@116.203.137.201 @'
cd ~/app
git fetch origin
git checkout release
git reset --hard origin/release
'@

Write-Host "✅ Code updated" -ForegroundColor Green

# Step 3: Recreate backend containers with new config
Write-Host "`n3️⃣  Recreating backend containers..." -ForegroundColor Yellow
ssh cuefinder@116.203.137.201 @'
cd ~/app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend-blue backend-green moderator nginx
'@

Write-Host "✅ Containers recreated" -ForegroundColor Green

# Step 4: Wait and check status
Write-Host "`n4️⃣  Waiting 15 seconds for containers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
ssh cuefinder@116.203.137.201 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Step 5: Check backend logs
Write-Host "`n📋 Backend Blue Logs (last 10 lines):" -ForegroundColor Cyan
ssh cuefinder@116.203.137.201 "docker logs cuefinder-backend-blue-prod --tail=10 2>&1"

Write-Host "`n✅ Fix complete! Check logs above for any errors." -ForegroundColor Green
Write-Host "If containers are healthy, your production site should be working now." -ForegroundColor Cyan
