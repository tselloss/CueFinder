# CueFinder End-to-End Test Runner
# This script starts all required services and runs the E2E tests

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CueFinder E2E Test Runner" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_DIR = "$PSScriptRoot\CueFinderBE"
$FRONTEND_DIR = "$PSScriptRoot\CueFinderFE\cuefinderfe"
$BACKEND_PORT = 5000
$FRONTEND_PORT = 3000
$POSTGRES_PORT = 5432

# Step 1: Check if PostgreSQL is running
Write-Host "[1/6] Checking PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=cuefinder-postgres" --format "{{.Names}}"
if ($postgresRunning -eq "cuefinder-postgres") {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is not running" -ForegroundColor Red
    Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
    
    # Try to start existing container
    $startResult = docker start cuefinder-postgres 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Container doesn't exist. Creating new PostgreSQL container..." -ForegroundColor Yellow
        docker run --name cuefinder-postgres `
            -e POSTGRES_USER=postgres `
            -e POSTGRES_PASSWORD=admin `
            -e POSTGRES_DB=cuefinder `
            -p 5432:5432 `
            -d postgres:16-alpine
        
        Write-Host "Waiting for PostgreSQL to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    
    Write-Host "✓ PostgreSQL started" -ForegroundColor Green
}
Write-Host ""

# Step 2: Check if backend port is available
Write-Host "[2/6] Checking backend availability..." -ForegroundColor Yellow
$backendProcess = Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction SilentlyContinue
if ($backendProcess) {
    Write-Host "✓ Backend is already running on port $BACKEND_PORT" -ForegroundColor Green
    $startBackend = $false
} else {
    Write-Host "Backend not running. Will start it." -ForegroundColor Yellow
    $startBackend = $true
}
Write-Host ""

# Step 3: Start Backend if needed
if ($startBackend) {
    Write-Host "[3/6] Starting Backend..." -ForegroundColor Yellow
    Write-Host "Location: $BACKEND_DIR" -ForegroundColor Gray
    
    $backendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        dotnet run
    } -ArgumentList $BACKEND_DIR
    
    Write-Host "Backend job started (ID: $($backendJob.Id))" -ForegroundColor Gray
    Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Check if backend is responding
    $maxRetries = 10
    $retryCount = 0
    $backendReady = $false
    
    while ($retryCount -lt $maxRetries -and -not $backendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT/api" -TimeoutSec 2 -ErrorAction SilentlyContinue
            $backendReady = $true
        } catch {
            $retryCount++
            Write-Host "  Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    
    if ($backendReady) {
        Write-Host "✓ Backend is ready" -ForegroundColor Green
    } else {
        Write-Host "⚠ Backend might not be fully ready" -ForegroundColor Yellow
    }
} else {
    Write-Host "[3/6] Backend already running" -ForegroundColor Green
}
Write-Host ""

# Step 4: Check if frontend port is available
Write-Host "[4/6] Checking frontend availability..." -ForegroundColor Yellow
$frontendProcess = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue
if ($frontendProcess) {
    Write-Host "✓ Frontend is already running on port $FRONTEND_PORT" -ForegroundColor Green
    $startFrontend = $false
} else {
    Write-Host "Frontend not running. Will start it." -ForegroundColor Yellow
    $startFrontend = $true
}
Write-Host ""

# Step 5: Start Frontend if needed
if ($startFrontend) {
    Write-Host "[5/6] Starting Frontend..." -ForegroundColor Yellow
    Write-Host "Location: $FRONTEND_DIR" -ForegroundColor Gray
    
    $frontendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        $env:BROWSER = "none"
        npm start
    } -ArgumentList $FRONTEND_DIR
    
    Write-Host "Frontend job started (ID: $($frontendJob.Id))" -ForegroundColor Gray
    Write-Host "Waiting for frontend to compile..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Check if frontend is responding
    $maxRetries = 10
    $retryCount = 0
    $frontendReady = $false
    
    while ($retryCount -lt $maxRetries -and -not $frontendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT" -TimeoutSec 2 -ErrorAction SilentlyContinue
            $frontendReady = $true
        } catch {
            $retryCount++
            Write-Host "  Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    
    if ($frontendReady) {
        Write-Host "✓ Frontend is ready" -ForegroundColor Green
    } else {
        Write-Host "⚠ Frontend might not be fully ready" -ForegroundColor Yellow
    }
} else {
    Write-Host "[5/6] Frontend already running" -ForegroundColor Green
}
Write-Host ""

# Step 6: Run E2E Tests
Write-Host "[6/6] Running E2E Tests..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Starting Playwright Tests" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $FRONTEND_DIR

# Check if Playwright is installed
if (-not (Test-Path "node_modules/@playwright")) {
    Write-Host "Installing Playwright..." -ForegroundColor Yellow
    npm install -D @playwright/test
    npx playwright install
}

# Run the tests
npx playwright test

$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if ($testExitCode -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "View detailed report with: npx playwright show-report" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Cleanup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to stop services
Write-Host "Do you want to stop the backend and frontend? (Y/N)" -ForegroundColor Yellow
$stopServices = Read-Host

if ($stopServices -eq "Y" -or $stopServices -eq "y") {
    if ($startBackend -and $backendJob) {
        Write-Host "Stopping backend job..." -ForegroundColor Yellow
        Stop-Job -Id $backendJob.Id
        Remove-Job -Id $backendJob.Id
        Write-Host "✓ Backend stopped" -ForegroundColor Green
    }
    
    if ($startFrontend -and $frontendJob) {
        Write-Host "Stopping frontend job..." -ForegroundColor Yellow
        Stop-Job -Id $frontendJob.Id
        Remove-Job -Id $frontendJob.Id
        Write-Host "✓ Frontend stopped" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Note: PostgreSQL container is still running" -ForegroundColor Gray
    Write-Host "To stop it: docker stop cuefinder-postgres" -ForegroundColor Gray
} else {
    Write-Host "Services are still running" -ForegroundColor Gray
    if ($startBackend) {
        Write-Host "  Backend job ID: $($backendJob.Id)" -ForegroundColor Gray
    }
    if ($startFrontend) {
        Write-Host "  Frontend job ID: $($frontendJob.Id)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "To stop them manually:" -ForegroundColor Gray
    Write-Host "  Get-Job | Stop-Job" -ForegroundColor Gray
    Write-Host "  Get-Job | Remove-Job" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "E2E Test Run Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

exit $testExitCode
