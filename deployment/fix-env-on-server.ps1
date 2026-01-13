# Quick fix script to update .env on production server
# Run this in PowerShell: .\deployment\fix-env-on-server.ps1
# WARNING: This file is for reference only. Use deploy-manual.ps1 or GitHub Actions instead.

$SERVER_USER = "cuefinder"
$SERVER_IP = "116.203.137.201"

Write-Host "🔧 Fixing .env file on production server..." -ForegroundColor Cyan

# Create the .env content
$envContent = @"
DB_PASSWORD=REPLACE_WITH_SECURE_PASSWORD
JWT_SECRET=REPLACE_WITH_SECURE_JWT_SECRET_MIN_32_CHARS
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
"@

Write-Host "📝 Creating .env file on server..." -ForegroundColor Yellow

# Execute commands on server
$commands = @"
cd /home/cuefinder/app && \
if [ -f .env ]; then cp .env .env.backup.\$(date +%Y%m%d_%H%M%S); echo 'Backed up existing .env'; fi && \
cat > .env << 'EOF'
$envContent
EOF
echo '✅ Created new .env file' && \
cat .env
"@

ssh "${SERVER_USER}@${SERVER_IP}" $commands

Write-Host ""
Write-Host "🐳 Restarting backend container..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER_IP}" "cd /home/cuefinder/app && docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend"

Write-Host ""
Write-Host "⏳ Waiting for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Checking container status..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER_IP}" "docker ps --format 'table {{.Names}}\t{{.Status}}'"

Write-Host ""
Write-Host "✅ Done! Backend should now be running with proper JWT secret." -ForegroundColor Green
Write-Host ""
Write-Host "To check backend logs, run:" -ForegroundColor Cyan
Write-Host "  ssh ${SERVER_USER}@${SERVER_IP} 'docker logs cuefinder-backend-prod --tail 50'" -ForegroundColor White
