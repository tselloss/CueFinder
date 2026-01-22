# Pre-Deployment Security Check Script (Windows)
# Run this before deploying to production to ensure no critical vulnerabilities exist

$ErrorActionPreference = "Stop"

Write-Host "🔒 CueFinder Pre-Deployment Security Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if application is running
Write-Host "📋 Checking if application is running..." -ForegroundColor Yellow
$backendRunning = docker ps --filter "name=cuefinder-backend" --format "{{.Names}}" | Select-String "cuefinder-backend"

if (-not $backendRunning) {
    Write-Host "⚠️  Application not running. Starting..." -ForegroundColor Yellow
    docker compose up -d
    Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

# Wait for health check
Write-Host "🏥 Checking application health..." -ForegroundColor Yellow
$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Application is healthy" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $healthy) {
    Write-Host "❌ Application health check failed" -ForegroundColor Red
    exit 1
}

# Run security tests
Write-Host ""
Write-Host "🔍 Running Security Tests..." -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan

Push-Location tests\SecurityTests

# Ensure dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Set API URL
$env:API_URL = "http://localhost:5000"

# Run API security tests
Write-Host ""
Write-Host "🔐 API Security Tests..." -ForegroundColor Yellow
try {
    node api-security-tests.js
    Write-Host "✅ API security tests passed" -ForegroundColor Green
} catch {
    Write-Host "❌ API security tests failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Check results
$report = Get-ChildItem -Filter "security-report-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $report) {
    Write-Host "❌ No security report generated" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Parse results
$results = Get-Content $report.FullName | ConvertFrom-Json

Write-Host ""
Write-Host "📊 Security Test Summary" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Total vulnerabilities: $($results.summary.total)"
Write-Host "Critical: $($results.summary.critical)" -ForegroundColor Red
Write-Host "High: $($results.summary.high)" -ForegroundColor Yellow
Write-Host "Medium: $($results.summary.medium)" -ForegroundColor Yellow
Write-Host "Low: $($results.summary.low)" -ForegroundColor Gray
Write-Host ""

# Check for blocking vulnerabilities
if ($results.summary.critical -gt 0) {
    Write-Host "❌ DEPLOYMENT BLOCKED: Critical vulnerabilities found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Critical vulnerabilities must be fixed before deployment:" -ForegroundColor Red
    $results.vulnerabilities | Where-Object { $_.severity -eq "CRITICAL" } | ForEach-Object {
        Write-Host "  - [$($_.severity)] $($_.endpoint ?? $_.area): $($_.description)" -ForegroundColor Red
    }
    Write-Host ""
    Pop-Location
    exit 1
}

if ($results.summary.high -gt 0) {
    Write-Host "⚠️  WARNING: High severity vulnerabilities found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "High severity issues detected:" -ForegroundColor Yellow
    $results.vulnerabilities | Where-Object { $_.severity -eq "HIGH" } | ForEach-Object {
        Write-Host "  - [$($_.severity)] $($_.endpoint ?? $_.area): $($_.description)" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $continue = Read-Host "Continue with deployment anyway? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "⏸️  Deployment cancelled by user" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
}

Pop-Location

Write-Host "✅ Security check passed - Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Security report saved: $($report.FullName)" -ForegroundColor Gray
Write-Host ""
exit 0
