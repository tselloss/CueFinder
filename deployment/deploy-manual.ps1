# Quick Manual Deployment to Hetzner
# This script deploys your app without GitHub Actions

param(
    [string]$ServerIP = "116.203.137.201",
    [string]$ServerUser = "cuefinder"
)

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🎱 CueFinder Manual Deployment 🎱                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload Docker Compose files
Write-Host "📦 Step 1: Uploading Docker Compose files..." -ForegroundColor Yellow
scp docker-compose.yml docker-compose.prod.yml "${ServerUser}@${ServerIP}:/home/cuefinder/app/"
Write-Host "   ✓ Files uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Upload application code
Write-Host "📂 Step 2: Uploading application code..." -ForegroundColor Yellow
scp -r CueFinderBE "${ServerUser}@${ServerIP}:/home/cuefinder/app/"
scp -r CueFinderFE "${ServerUser}@${ServerIP}:/home/cuefinder/app/"
scp -r Models "${ServerUser}@${ServerIP}:/home/cuefinder/app/"
scp -r SolutionLibraries "${ServerUser}@${ServerIP}:/home/cuefinder/app/"
Write-Host "   ✓ Code uploaded" -ForegroundColor Green
Write-Host ""

# Step 3: Create environment file
Write-Host "⚙️  Step 3: Creating environment file..." -ForegroundColor Yellow
$dbPassword = Read-Host "Enter DB_PASSWORD (or press Enter to generate)" -AsSecureString
if ([string]::IsNullOrEmpty([Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)))) {
    $dbPasswordPlain = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "   Generated DB password: $dbPasswordPlain" -ForegroundColor Gray
} else {
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
}

$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "   Generated JWT secret" -ForegroundColor Gray

$envContent = @"
DB_PASSWORD=$dbPasswordPlain
JWT_SECRET=$jwtSecret
FRONTEND_API_URL=http://${ServerIP}:5000
"@

$envContent | ssh "${ServerUser}@${ServerIP}" "cat > /home/cuefinder/app/.env"
Write-Host "   ✓ Environment configured" -ForegroundColor Green
Write-Host ""

# Step 4: Build and start containers
Write-Host "🐳 Step 4: Building and starting Docker containers..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerIP}" @"
cd /home/cuefinder/app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
"@
Write-Host "   ✓ Containers started" -ForegroundColor Green
Write-Host ""

# Step 5: Check status
Write-Host "📊 Step 5: Checking container status..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerIP}" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
Write-Host ""

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 ✅ Deployment Complete! ✅                ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application is now running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://${ServerIP}" -ForegroundColor White
Write-Host "   Backend:  http://${ServerIP}:5000" -ForegroundColor White
Write-Host ""
Write-Host "💾 Save these credentials:" -ForegroundColor Yellow
Write-Host "   DB_PASSWORD=$dbPasswordPlain" -ForegroundColor Gray
Write-Host "   JWT_SECRET=$jwtSecret" -ForegroundColor Gray
Write-Host ""
