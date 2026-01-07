# Wait for containers to be ready and run E2E tests

Write-Host "`n===== Waiting for containers to be ready =====" -ForegroundColor Cyan

# Wait for containers to start
Start-Sleep -Seconds 30

# Check container status
Write-Host "`nContainer Status:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}" 

# Check backend logs
Write-Host "`nBackend Logs (last 15 lines):" -ForegroundColor Yellow
docker logs cuefinder-backend --tail 15

# Wait a bit more for backend to fully initialize
Write-Host "`nWaiting 10 more seconds for backend initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test backend health
Write-Host "`nTesting backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/swagger/index.html" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend health check failed: $_" -ForegroundColor Red
}

# Create admin user via API
Write-Host "`nCreating admin user..." -ForegroundColor Yellow
& "$PSScriptRoot\create-admin-user.ps1"

# Fix database schema
Write-Host "`nFixing database schema..." -ForegroundColor Yellow
& "$PSScriptRoot\fix-database-schema.ps1"

# Test frontend health  
Write-Host "`nTesting frontend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend health check failed: $_" -ForegroundColor Red
}

Write-Host "`n===== Running E2E Tests =====" -ForegroundColor Cyan
cd C:\Users\karac\source\repos\CueFinder\CueFinderFE\cuefinderfe
npx playwright test --reporter=line

Write-Host "`n===== Tests Complete =====" -ForegroundColor Cyan
