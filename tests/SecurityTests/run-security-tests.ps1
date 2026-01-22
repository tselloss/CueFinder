# CueFinder Security & Penetration Test Runner
# Runs all security and penetration tests

param(
    [switch]$API,
    [switch]$FileUpload,
    [switch]$Auth,
    [switch]$ZAP,
    [switch]$All,
    [string]$ApiUrl = "http://localhost:5000",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$TestDir = $PSScriptRoot

Write-Host "🔒 CueFinder Security & Penetration Testing Suite" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Check if Docker containers are running
Write-Host "Checking if application is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/health" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is running at $ApiUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Warning: Cannot reach application at $ApiUrl" -ForegroundColor Yellow
    Write-Host "   Make sure your application is running before executing tests" -ForegroundColor Yellow
    $continue = Read-Host "   Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

Write-Host ""

# Set environment variable
$env:API_URL = $ApiUrl

# Function to run a test
function Run-SecurityTest {
    param(
        [string]$TestName,
        [string]$TestScript,
        [string]$Icon
    )
    
    Write-Host ""
    Write-Host "$Icon Running $TestName..." -ForegroundColor Cyan
    Write-Host "-" * 80 -ForegroundColor Gray
    
    $startTime = Get-Date
    
    Push-Location $TestDir
    try {
        if ($Verbose) {
            node $TestScript
        } else {
            node $TestScript 2>&1 | Out-String | Write-Host
        }
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ $TestName completed in $([math]::Round($duration, 2))s" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ $TestName failed after $([math]::Round($duration, 2))s" -ForegroundColor Red
        }
    } catch {
        Write-Host ""
        Write-Host "❌ $TestName error: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

# Run selected tests
$testsRun = 0

if ($All -or $API) {
    Run-SecurityTest -TestName "API Security Tests" -TestScript "api-security-tests.js" -Icon "🔍"
    $testsRun++
}

if ($All -or $FileUpload) {
    Run-SecurityTest -TestName "File Upload Security Tests" -TestScript "file-upload-security-tests.js" -Icon "📁"
    $testsRun++
}

if ($All -or $Auth) {
    Run-SecurityTest -TestName "Authentication & Authorization Tests" -TestScript "auth-penetration-tests.js" -Icon "🔐"
    $testsRun++
}

if ($All -or $ZAP) {
    Write-Host ""
    Write-Host "🕷️  Running OWASP ZAP Security Scan..." -ForegroundColor Cyan
    Write-Host "-" * 80 -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Note: OWASP ZAP must be running for this scan to work" -ForegroundColor Yellow
    Write-Host "   Download: https://www.zaproxy.org/download/" -ForegroundColor Yellow
    Write-Host "   Start with: zap.bat -daemon -port 8080 -config api.key=changeme" -ForegroundColor Yellow
    Write-Host ""
    
    $zapContinue = Read-Host "Is ZAP running? (y/n)"
    if ($zapContinue -eq 'y') {
        Run-SecurityTest -TestName "OWASP ZAP Scan" -TestScript "zap-integration.js" -Icon "🕷️"
        $testsRun++
    } else {
        Write-Host "⏭️  Skipping ZAP scan" -ForegroundColor Yellow
    }
}

# If no tests specified, show help
if ($testsRun -eq 0) {
    Write-Host "Usage: .\run-security-tests.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -API             Run API security tests (SQL injection, XSS, etc.)"
    Write-Host "  -FileUpload      Run file upload security tests"
    Write-Host "  -Auth            Run authentication & authorization tests"
    Write-Host "  -ZAP             Run OWASP ZAP automated scan (requires ZAP running)"
    Write-Host "  -All             Run all security tests"
    Write-Host "  -ApiUrl <url>    Specify API URL (default: http://localhost:5000)"
    Write-Host "  -Verbose         Show detailed output"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\run-security-tests.ps1 -All"
    Write-Host "  .\run-security-tests.ps1 -API -Auth"
    Write-Host "  .\run-security-tests.ps1 -ZAP -ApiUrl http://production-url.com"
    Write-Host ""
    exit 0
}

# Summary
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📊 Test Execution Summary" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests executed: $testsRun" -ForegroundColor White
Write-Host "Target URL: $ApiUrl" -ForegroundColor White
Write-Host ""

# List generated reports
Write-Host "📄 Generated Reports:" -ForegroundColor Cyan
Get-ChildItem -Path $TestDir -Filter "*-report-*.json" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 10 | 
    ForEach-Object {
        Write-Host "   $($_.Name) ($([math]::Round($_.Length / 1KB, 2)) KB)" -ForegroundColor Gray
    }

Get-ChildItem -Path $TestDir -Filter "*-report-*.html" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 | 
    ForEach-Object {
        Write-Host "   $($_.Name) ($([math]::Round($_.Length / 1KB, 2)) KB)" -ForegroundColor Gray
    }

Write-Host ""
Write-Host "✅ Security testing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Review all generated reports for vulnerabilities" -ForegroundColor Yellow
Write-Host "   and take appropriate action to fix any security issues found." -ForegroundColor Yellow
Write-Host ""
