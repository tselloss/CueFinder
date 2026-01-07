# Reset and start CueFinder containers
Write-Host "Stopping and removing containers..." -ForegroundColor Yellow
docker compose down -v

Write-Host "`nRebuilding and starting containers..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host "`nWaiting for containers to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`nChecking container status..." -ForegroundColor Yellow
docker ps

Write-Host "`n" 
Write-Host "Checking backend logs..." -ForegroundColor Yellow
docker logs cuefinder-backend --tail 20

Write-Host "`n"
Write-Host "Creating admin user..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
& "$PSScriptRoot\create-admin-user.ps1"

Write-Host "`n"
Write-Host "Fixing database schema..." -ForegroundColor Yellow
& "$PSScriptRoot\fix-database-schema.ps1"

Write-Host "`n" 
Write-Host "==================================================" -ForegroundColor Green
Write-Host "If the backend started successfully, access:" -ForegroundColor Green
Write-Host "Swagger UI: http://localhost:5000/swagger/index.html" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "PgAdmin: http://localhost:5050" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
