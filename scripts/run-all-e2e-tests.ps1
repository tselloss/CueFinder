#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run all Playwright E2E tests for CueFinder application

.DESCRIPTION
    This script runs the complete E2E test suite including:
    - User registration and cue listing tests
    - Cue case listing tests
    - Product type selection tests
    
.PARAMETER TestFile
    Optional: Specify a specific test file to run
    
.PARAMETER Headed
    Run tests in headed mode (visible browser)
    
.PARAMETER Debug
    Run tests in debug mode with Playwright Inspector
    
.PARAMETER Update
    Update snapshots for visual regression tests

.EXAMPLE
    .\run-all-e2e-tests.ps1
    Run all tests in headless mode

.EXAMPLE
    .\run-all-e2e-tests.ps1 -Headed
    Run all tests with visible browser

.EXAMPLE
    .\run-all-e2e-tests.ps1 -TestFile "cue-case-listing.spec.js" -Debug
    Run specific test in debug mode

.EXAMPLE
    .\run-all-e2e-tests.ps1 -TestFile "cue-case-listing.spec.js" -Headed
    Run specific test with visible browser
#>

param(
    [string]$TestFile = "",
    [switch]$Headed,
    [switch]$Debug,
    [switch]$Update
)

# Color codes for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "${Blue}╔════════════════════════════════════════════════════╗${Reset}"
Write-Host "${Blue}║     CueFinder E2E Test Suite - Playwright         ║${Reset}"
Write-Host "${Blue}╚════════════════════════════════════════════════════╝${Reset}"
Write-Host ""

# Navigate to frontend directory
$frontendDir = Join-Path $PSScriptRoot ".." "CueFinderFE" "cuefinderfe"
if (-not (Test-Path $frontendDir)) {
    Write-Host "${Red}❌ Frontend directory not found: $frontendDir${Reset}"
    exit 1
}

Set-Location $frontendDir
Write-Host "${Green}📁 Working directory: $frontendDir${Reset}"
Write-Host ""

# Check if Docker containers are running
Write-Host "${Yellow}🔍 Checking if Docker containers are running...${Reset}"

$backendRunning = docker ps --filter "name=cuefinder-backend" --filter "status=running" --format "{{.Names}}"
$frontendRunning = docker ps --filter "name=cuefinder-frontend" --filter "status=running" --format "{{.Names}}"
$dbRunning = docker ps --filter "name=cuefinder-postgres" --filter "status=running" --format "{{.Names}}"

if (-not $backendRunning) {
    Write-Host "${Red}❌ Backend container is not running!${Reset}"
    Write-Host "${Yellow}   Please run: docker compose up -d backend${Reset}"
    exit 1
}

if (-not $frontendRunning) {
    Write-Host "${Red}❌ Frontend container is not running!${Reset}"
    Write-Host "${Yellow}   Please run: docker compose up -d frontend${Reset}"
    exit 1
}

if (-not $dbRunning) {
    Write-Host "${Red}❌ Database container is not running!${Reset}"
    Write-Host "${Yellow}   Please run: docker compose up -d postgres${Reset}"
    exit 1
}

Write-Host "${Green}✅ All required containers are running${Reset}"
Write-Host ""

# Wait for services to be ready
Write-Host "${Yellow}⏳ Waiting for services to be ready...${Reset}"
Start-Sleep -Seconds 3

# Test backend API
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/cues" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "${Green}✅ Backend API is responding${Reset}"
} catch {
    Write-Host "${Red}❌ Backend API is not responding at http://localhost:5000${Reset}"
    exit 1
}

# Test frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "${Green}✅ Frontend is responding${Reset}"
} catch {
    Write-Host "${Red}❌ Frontend is not responding at http://localhost:3000${Reset}"
    exit 1
}

Write-Host ""

# Build test command
$testCommand = "npx playwright test"

if ($TestFile) {
    $testCommand += " $TestFile"
    Write-Host "${Blue}🎯 Running specific test file: $TestFile${Reset}"
} else {
    Write-Host "${Blue}🎯 Running all E2E tests${Reset}"
}

if ($Headed) {
    $testCommand += " --headed"
    Write-Host "${Blue}👁️  Running in headed mode (visible browser)${Reset}"
}

if ($Debug) {
    $testCommand += " --debug"
    Write-Host "${Blue}🐛 Running in debug mode${Reset}"
}

if ($Update) {
    $testCommand += " --update-snapshots"
    Write-Host "${Blue}📸 Updating snapshots${Reset}"
}

Write-Host ""
Write-Host "${Yellow}════════════════════════════════════════════════════${Reset}"
Write-Host "${Yellow}  Executing: $testCommand${Reset}"
Write-Host "${Yellow}════════════════════════════════════════════════════${Reset}"
Write-Host ""

# Run tests
$env:CI = "false"  # Disable CI mode for better output
Invoke-Expression $testCommand

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "${Yellow}════════════════════════════════════════════════════${Reset}"

if ($exitCode -eq 0) {
    Write-Host "${Green}✅ All tests passed successfully!${Reset}"
    Write-Host ""
    Write-Host "${Blue}📊 Test Reports:${Reset}"
    Write-Host "   HTML Report: ${Blue}npx playwright show-report${Reset}"
    Write-Host "   JSON Report: ${Blue}./test-results/*.json${Reset}"
} else {
    Write-Host "${Red}❌ Some tests failed!${Reset}"
    Write-Host ""
    Write-Host "${Yellow}📊 View detailed report:${Reset}"
    Write-Host "   ${Blue}npx playwright show-report${Reset}"
    Write-Host ""
    Write-Host "${Yellow}🐛 Debug failed tests:${Reset}"
    Write-Host "   ${Blue}npx playwright test --debug${Reset}"
}

Write-Host "${Yellow}════════════════════════════════════════════════════${Reset}"
Write-Host ""

exit $exitCode
