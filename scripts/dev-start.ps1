# Quick Development Setup Script
# This runs the backend and frontend locally with hot-reload (no Docker rebuild needed!)

Write-Host "=== CueFinder Development Mode ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker postgres is running
$postgres = docker ps --filter "name=cuefinder-postgres" --format "{{.Names}}" 2>$null
if (-not $postgres) {
    Write-Host "Starting PostgreSQL in Docker..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml up -d postgres pgadmin
    Start-Sleep -Seconds 5
}

Write-Host "PostgreSQL is running on localhost:5432" -ForegroundColor Green
Write-Host "PgAdmin is running on http://localhost:5050" -ForegroundColor Green
Write-Host ""

# Start backend in new terminal
Write-Host "Starting Backend with hot-reload..." -ForegroundColor Yellow
$backendCmd = "cd '$PSScriptRoot\..\CueFinderBE'; dotnet watch run"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 3

# Start frontend in new terminal  
Write-Host "Starting Frontend with hot-reload..." -ForegroundColor Yellow
$frontendCmd = "cd '$PSScriptRoot\..\CueFinderFE\cuefinderfe'; npm start"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "=== Development Environment Ready! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Swagger:  http://localhost:5000/swagger" -ForegroundColor Cyan
Write-Host "PgAdmin:  http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes to code will auto-reload (no Docker rebuild needed!)" -ForegroundColor Green
