#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run Cue Case E2E tests

.DESCRIPTION
    Quick script to run only the cue case listing tests

.PARAMETER Headed
    Run tests in headed mode (visible browser)
    
.PARAMETER Debug
    Run tests in debug mode

.EXAMPLE
    .\run-cue-case-tests.ps1

.EXAMPLE
    .\run-cue-case-tests.ps1 -Headed

.EXAMPLE
    .\run-cue-case-tests.ps1 -Debug
#>

param(
    [switch]$Headed,
    [switch]$Debug
)

Write-Host "`n🎯 Running Cue Case E2E Tests...`n" -ForegroundColor Cyan

# Navigate to frontend directory
$scriptDir = $PSScriptRoot
$frontendDir = Join-Path $scriptDir ".." "CueFinderFE" "cuefinderfe"

if (-not (Test-Path $frontendDir)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $frontendDir

# Build command
$cmd = "npx playwright test cue-case-api.spec.js"

if ($Headed) {
    $cmd += " --headed"
}

if ($Debug) {
    $cmd += " --debug"
}

Write-Host "Executing: $cmd`n" -ForegroundColor Yellow

# Run tests
Invoke-Expression $cmd

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "`n✅ All cue case tests passed!`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Run with -Debug flag for more info.`n" -ForegroundColor Red
}

exit $exitCode
