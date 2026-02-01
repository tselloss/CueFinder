#Requires -Version 5.0
<#
.SYNOPSIS
    E2E Test Runner Script for CueFinder
    
.DESCRIPTION
    Runs all e2e tests with various options
    
.PARAMETER Mode
    Test execution mode: Headless (default), Headed, Debug, or UI
    
.PARAMETER Test
    Specific test to run: All (default), Auth, Forum, UI
    
.EXAMPLE
    .\run-e2e-tests.ps1
    .\run-e2e-tests.ps1 -Mode Headed
    .\run-e2e-tests.ps1 -Test Forum
    .\run-e2e-tests.ps1 -Mode Debug -Test UI
#>

param(
    [ValidateSet('Headless', 'Headed', 'Debug', 'UI')]
    [string]$Mode = 'Headless',
    
    [ValidateSet('All', 'Auth', 'Forum', 'UI')]
    [string]$Test = 'All',
    
    [switch]$ShowReport,
    [switch]$NoReport
)

# Colors for output
$Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n" -ForegroundColor $Colors.Info
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Info
    Write-Host "║  $($Message.PadRight(60))  ║" -ForegroundColor $Colors.Info
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Info
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Info
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Success
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Error
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Warning
}

# Header
Write-Header "CueFinder E2E Test Suite Runner"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Info "Script Directory: $ScriptDir"
Write-Info "Mode: $Mode"
Write-Info "Test: $Test"
Write-Host ""

# Check if dependencies are installed
Write-Host "📋 Checking dependencies..." -ForegroundColor $Colors.Info

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "npm is not installed or not in PATH"
    exit 1
}

Write-Success "npm found"

# Define test files
$TestFiles = @{
    'Auth'  = 'complete-user-journey.spec.js'
    'Forum' = 'forum-complete-flow.spec.js'
    'UI'    = 'ui-components-visibility.spec.js'
}

# Build test pattern
$TestPattern = if ($Test -eq 'All') {
    $TestFiles.Values | ForEach-Object { "$ScriptDir\$_" }
} else {
    "$ScriptDir\$($TestFiles[$Test])"
}

# Build playwright arguments
$PlaywrightArgs = @('test')
$PlaywrightArgs += $TestPattern

switch ($Mode) {
    'Headed' { $PlaywrightArgs += '--headed' }
    'Debug'  { $PlaywrightArgs += '--debug' }
    'UI'     { $PlaywrightArgs += '--ui' }
}

if (-not $NoReport) {
    $PlaywrightArgs += '--reporter=html'
}

Write-Info "Test files: $($TestPattern -join ', ')"
Write-Host ""

# Run tests
Write-Host "🚀 Starting test execution..." -ForegroundColor $Colors.Info
Write-Host ""

try {
    & npm run test:e2e -- $TestPattern

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Header "Test Execution Complete"
        Write-Success "All tests completed successfully!"
    } else {
        Write-Host ""
        Write-Header "Test Execution Complete"
        Write-Warning-Custom "Some tests failed or encountered errors (Exit Code: $LASTEXITCODE)"
    }
} catch {
    Write-Host ""
    Write-Header "Test Execution Error"
    Write-Error-Custom "Failed to run tests: $_"
    exit 1
}

# Show report if requested
if ($ShowReport -and -not $NoReport) {
    Write-Info "Opening test report..."
    & npm run test:report
}

Write-Host ""
Write-Host "📊 Reports and screenshots:" -ForegroundColor $Colors.Info
Write-Host "  Location: $ProjectRoot/test-results"
Write-Host "  View Report: npm run test:report"
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor $Colors.Info
Write-Host "  • Run with browser visible: .\run-e2e-tests.ps1 -Mode Headed"
Write-Host "  • Debug mode: .\run-e2e-tests.ps1 -Mode Debug"
Write-Host "  • Interactive UI: .\run-e2e-tests.ps1 -Mode UI"
Write-Host "  • Specific test: .\run-e2e-tests.ps1 -Test Forum"
Write-Host "  • Show report after: .\run-e2e-tests.ps1 -ShowReport"
Write-Host ""
