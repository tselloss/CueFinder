# Test Problem Details Error Handling - Playwright E2E Test
# This script runs the Problem Details error handling test in headed mode with slow motion
# so you can visualize how errors are displayed to users

Write-Host "🎬 Problem Details Error Handling - Visual E2E Test" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend and frontend are running
Write-Host "🔍 Checking if services are running..." -ForegroundColor Yellow

# Check backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend is running on http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify backend on http://localhost:5000" -ForegroundColor Yellow
    Write-Host "   If not running, start it with: docker compose up backend -d" -ForegroundColor Yellow
    Write-Host ""
}

# Check frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is NOT running on http://localhost:3000" -ForegroundColor Red
    Write-Host "   Start it with: docker compose up frontend -d" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "📋 Test Options:" -ForegroundColor Cyan
Write-Host "  1. Run with browser visible (headed mode) - RECOMMENDED" -ForegroundColor White
Write-Host "  2. Run with slow motion (1 second delays) - BEST FOR VISUALIZATION" -ForegroundColor White
Write-Host "  3. Run headless (no browser window)" -ForegroundColor White
Write-Host "  4. Run specific test" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choose option (1-4) or press Enter for option 2 (slow motion)"

if ([string]::IsNullOrWhiteSpace($choice)) {
    $choice = "2"
}

# Navigate to frontend directory
Set-Location -Path "CueFinderFE/cuefinderfe"

Write-Host ""
Write-Host "🎬 Running tests..." -ForegroundColor Cyan
Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "▶️  Running in HEADED mode (browser visible)..." -ForegroundColor Green
        npx playwright test problem-details-error-handling.spec.js --headed
    }
    "2" {
        Write-Host "▶️  Running in HEADED mode with SLOW MOTION (1000ms delays)..." -ForegroundColor Green
        Write-Host "   You can watch each step of the test!" -ForegroundColor Yellow
        $env:PWDEBUG = "0"
        npx playwright test problem-details-error-handling.spec.js --headed --timeout=120000
    }
    "3" {
        Write-Host "▶️  Running in HEADLESS mode (no browser window)..." -ForegroundColor Green
        npx playwright test problem-details-error-handling.spec.js
    }
    "4" {
        Write-Host ""
        Write-Host "Available tests:" -ForegroundColor Cyan
        Write-Host "  1. Invalid Login (401)" -ForegroundColor White
        Write-Host "  2. Short Password Validation (400)" -ForegroundColor White
        Write-Host "  3. Duplicate Username (409)" -ForegroundColor White
        Write-Host "  4. Invalid Email (400)" -ForegroundColor White
        Write-Host "  5. Network Error" -ForegroundColor White
        Write-Host "  6. Multiple Validation Errors" -ForegroundColor White
        Write-Host "  7. Cache Headers Verification" -ForegroundColor White
        Write-Host ""
        
        $testChoice = Read-Host "Choose test (1-7)"
        
        $testName = switch ($testChoice) {
            "1" { "Login Error: Invalid Credentials" }
            "2" { "Registration Error: Validation - Password Too Short" }
            "3" { "Registration Error: Duplicate Username" }
            "4" { "Profile Update Error: Invalid Email Format" }
            "5" { "Network Error: Backend Unavailable" }
            "6" { "Complete Error Flow: Multiple Validation Errors" }
            "7" { "Verify Cache Headers on Successful Requests" }
            default { "Login Error: Invalid Credentials" }
        }
        
        Write-Host "▶️  Running test: $testName" -ForegroundColor Green
        npx playwright test problem-details-error-handling.spec.js --headed --timeout=120000 --grep="$testName"
    }
}

Write-Host ""
Write-Host "✅ Test execution complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📸 Screenshots saved in: test-results/" -ForegroundColor Cyan
Write-Host "📊 HTML Report: playwright-report/" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view the HTML report, run:" -ForegroundColor Yellow
Write-Host "  npx playwright show-report" -ForegroundColor White
Write-Host ""

# Return to root directory
Set-Location -Path "../.."
