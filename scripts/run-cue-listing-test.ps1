# Run E2E Test: User Registration and Cue Listing
#
# This script ensures the backend and frontend are running,
# then executes the e2e test for user registration and cue listing management.
#
# Usage:
#   .\run-cue-listing-test.ps1
#   .\run-cue-listing-test.ps1 -Headed     # Run with visible browser
#   .\run-cue-listing-test.ps1 -Debug      # Run in debug mode

param(
    [switch]$Headed = $false,
    [switch]$Debug = $false,
    [switch]$UI = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "E2E Test: User Registration & Cue Listing" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# Check if Docker containers are running
Write-Host "Checking Docker containers..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}}" 2>$null

if ($containers -notcontains "cuefinder-backend" -or $containers -notcontains "cuefinder-frontend") {
    Write-Host "❌ Docker containers not running!" -ForegroundColor Red
    Write-Host "`nStarting Docker containers..." -ForegroundColor Yellow
    
    Set-Location $PSScriptRoot\..
    docker-compose up -d
    
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
    
    # Check backend health
    $backendReady = $false
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {
            Write-Host "  Waiting for backend... ($i/10)" -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    
    if (-not $backendReady) {
        Write-Host "⚠️  Backend may not be ready, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Backend is ready" -ForegroundColor Green
    }
    
    # Check frontend
    $frontendReady = $false
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                break
            }
        } catch {
            Write-Host "  Waiting for frontend... ($i/10)" -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    
    if (-not $frontendReady) {
        Write-Host "⚠️  Frontend may not be ready, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Frontend is ready" -ForegroundColor Green
    }
} else {
    Write-Host "✓ Docker containers are running" -ForegroundColor Green
}

Write-Host "`nChecking services..." -ForegroundColor Yellow

# Check backend
try {
    $backendCheck = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✓ Backend is accessible at http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend may not be accessible at http://localhost:5000" -ForegroundColor Yellow
}

# Check frontend
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✓ Frontend is accessible at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend may not be accessible at http://localhost:3000" -ForegroundColor Yellow
}

# Navigate to frontend directory
Set-Location $PSScriptRoot\..\CueFinderFE\cuefinderfe

Write-Host "`nRunning E2E tests..." -ForegroundColor Yellow
Write-Host "Test file: user-cue-listing.spec.js`n" -ForegroundColor Cyan

# Build the command
$testCommand = "npx playwright test user-cue-listing.spec.js"

if ($Debug) {
    $testCommand += " --debug"
    Write-Host "Running in DEBUG mode (browser will open with DevTools)" -ForegroundColor Magenta
} elseif ($UI) {
    $testCommand += " --ui"
    Write-Host "Running in UI mode" -ForegroundColor Magenta
} elseif ($Headed) {
    $testCommand += " --headed"
    Write-Host "Running with VISIBLE browser" -ForegroundColor Magenta
} else {
    Write-Host "Running in HEADLESS mode" -ForegroundColor Gray
}

Write-Host "`nExecuting: $testCommand`n" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# Run the test
Invoke-Expression $testCommand

$exitCode = $LASTEXITCODE

Write-Host "`n========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "`n✅ E2E TEST PASSED!" -ForegroundColor Green
    Write-Host "`nTest Summary:" -ForegroundColor Cyan
    Write-Host "  ✓ User registration flow" -ForegroundColor Green
    Write-Host "  ✓ User authentication" -ForegroundColor Green
    Write-Host "  ✓ Navigate to profile/listings" -ForegroundColor Green
    Write-Host "  ✓ Create new cue listing" -ForegroundColor Green
    Write-Host "  ✓ Edit cue listing" -ForegroundColor Green
    Write-Host "  ✓ Mark cue as sold" -ForegroundColor Green
    Write-Host "  ✓ Delete cue listing" -ForegroundColor Green
    Write-Host "  ✓ User logout" -ForegroundColor Green
} else {
    Write-Host "`n❌ E2E TEST FAILED!" -ForegroundColor Red
    Write-Host "`nCheck the test output above for details." -ForegroundColor Yellow
    Write-Host "You can also view the HTML report with:" -ForegroundColor Yellow
    Write-Host "  npx playwright show-report" -ForegroundColor Cyan
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "Test run complete" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# Optional: Show report
if ($exitCode -ne 0) {
    $showReport = Read-Host "Would you like to open the test report? (y/n)"
    if ($showReport -eq "y" -or $showReport -eq "Y") {
        Write-Host "`nOpening test report..." -ForegroundColor Yellow
        npx playwright show-report
    }
}

exit $exitCode
