# Quick Security Test Runner for Production Server
# Handles all common scenarios automatically

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║          🔒 Production Security Test Runner 🔒            ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "📡 Checking server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✓ Backend server is responding" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend server is not responding" -ForegroundColor Red
    Write-Host "   Starting Docker containers..." -ForegroundColor Yellow
    docker compose up -d
    Write-Host "   Waiting 15 seconds for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5 -UseBasicParsing
        Write-Host "   ✓ Backend server is now responding" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Backend server still not responding" -ForegroundColor Red
        Write-Host "   Please check Docker logs: docker compose logs backend" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Ask user about rate limiting
Write-Host "⚡ Rate Limiting Options:" -ForegroundColor Cyan
Write-Host "  1) Run with rate limiting (slower, ~3 min, production-like) [DEFAULT]"
Write-Host "  2) Temporarily disable rate limiting (faster, ~30 sec)"
Write-Host ""
$rateChoice = Read-Host "Choose option [1]"
if ([string]::IsNullOrWhiteSpace($rateChoice)) { $rateChoice = "1" }

$rateLimitingDisabled = $false

if ($rateChoice -eq "2") {
    Write-Host ""
    Write-Host "⚠️  Disabling rate limiting..." -ForegroundColor Yellow
    Write-Host "   WARNING: Rate limiting will be disabled during tests!" -ForegroundColor Red
    
    # Comment out rate limiting in Program.cs
    $programFile = "CueFinderBE/Program.cs"
    $content = Get-Content $programFile -Raw
    $content = $content -replace '([^/])app\.UseRateLimiting', '$1// app.UseRateLimiting'
    Set-Content $programFile -Value $content
    
    Write-Host "   Rebuilding backend..." -ForegroundColor Yellow
    docker compose build backend | Out-Null
    
    Write-Host "   Restarting backend..." -ForegroundColor Yellow
    docker compose restart backend | Out-Null
    
    Write-Host "   Waiting 15 seconds for backend to restart..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host "   ✓ Rate limiting disabled" -ForegroundColor Green
    $rateLimitingDisabled = $true
}

Write-Host ""
Write-Host "🔍 Running Security Tests..." -ForegroundColor Cyan
Write-Host ""

Push-Location tests\SecurityTests
try {
    node api-security-tests.js
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "✅ Security tests completed!" -ForegroundColor Green
Write-Host ""

# If rate limiting was disabled, re-enable it
if ($rateLimitingDisabled) {
    Write-Host "🔄 Re-enabling rate limiting..." -ForegroundColor Yellow
    
    $programFile = "CueFinderBE/Program.cs"
    $content = Get-Content $programFile -Raw
    $content = $content -replace '//\s*app\.UseRateLimiting', 'app.UseRateLimiting'
    Set-Content $programFile -Value $content
    
    Write-Host "   Rebuilding backend..." -ForegroundColor Yellow
    docker compose build backend | Out-Null
    
    Write-Host "   Restarting backend..." -ForegroundColor Yellow
    docker compose restart backend | Out-Null
    
    Write-Host "   ✓ Rate limiting re-enabled" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 View detailed report:" -ForegroundColor Cyan
$latestReport = Get-ChildItem tests\SecurityTests\security-report-*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestReport) {
    Write-Host "   Get-Content $($latestReport.FullName) | ConvertFrom-Json | ConvertTo-Json -Depth 5" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Latest report:" -ForegroundColor Cyan
    $report = Get-Content $latestReport.FullName | ConvertFrom-Json
    Write-Host "   Target: $($report.target)" -ForegroundColor Gray
    Write-Host "   Time: $($report.timestamp)" -ForegroundColor Gray
    Write-Host "   Total Vulnerabilities: $($report.summary.total)" -ForegroundColor $(if ($report.summary.total -eq 0) { "Green" } else { "Red" })
    if ($report.summary.total -gt 0) {
        Write-Host "   Critical: $($report.summary.critical)" -ForegroundColor Red
        Write-Host "   High: $($report.summary.high)" -ForegroundColor Yellow
        Write-Host "   Medium: $($report.summary.medium)" -ForegroundColor Yellow
        Write-Host "   Low: $($report.summary.low)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ All done!" -ForegroundColor Green
