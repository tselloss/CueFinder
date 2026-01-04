# Quick E2E Test Runner
# Assumes services are already running

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Quick E2E Test (Services Must Be Running)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$FRONTEND_DIR = "$PSScriptRoot\CueFinderFE\cuefinderfe"

# Check services
Write-Host "Checking services..." -ForegroundColor Yellow

$checks = @(
    @{ Name = "PostgreSQL"; Port = 5432; Url = $null }
    @{ Name = "Backend"; Port = 5000; Url = "http://localhost:5000/api" }
    @{ Name = "Frontend"; Port = 3000; Url = "http://localhost:3000" }
)

$allRunning = $true

foreach ($check in $checks) {
    $running = $false
    
    if ($check.Url) {
        try {
            $response = Invoke-WebRequest -Uri $check.Url -TimeoutSec 2 -ErrorAction SilentlyContinue
            $running = $true
        } catch {
            $running = $false
        }
    } else {
        $connection = Get-NetTCPConnection -LocalPort $check.Port -ErrorAction SilentlyContinue
        $running = $connection -ne $null
    }
    
    if ($running) {
        Write-Host "  ✓ $($check.Name) is running on port $($check.Port)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($check.Name) is NOT running on port $($check.Port)" -ForegroundColor Red
        $allRunning = $false
    }
}

Write-Host ""

if (-not $allRunning) {
    Write-Host "ERROR: Not all services are running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the services first:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL: docker start cuefinder-postgres" -ForegroundColor Gray
    Write-Host "  2. Backend: cd CueFinderBE && dotnet run" -ForegroundColor Gray
    Write-Host "  3. Frontend: cd CueFinderFE/cuefinderfe && npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use the full test runner: .\run-e2e-tests.ps1" -ForegroundColor Yellow
    exit 1
}

# Run tests
Write-Host "Running E2E tests..." -ForegroundColor Cyan
Write-Host ""

Set-Location $FRONTEND_DIR

# Check if Playwright is installed
if (-not (Test-Path "node_modules/@playwright")) {
    Write-Host "Installing Playwright..." -ForegroundColor Yellow
    npm install -D @playwright/test
    npx playwright install
    Write-Host ""
}

npx playwright test

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host "View report: npx playwright show-report" -ForegroundColor Yellow
}

exit $exitCode
