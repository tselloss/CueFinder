# Run All Tests (Unit + Integration)
# This script runs unit tests first, then integration tests with Docker

Write-Host "🧪 CueFinder Complete Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$testsFailed = $false

# Navigate to tests directory
Set-Location $PSScriptRoot

# Run Unit Tests
Write-Host "STEP 1: Running Unit Tests" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Running CueFinder.Auth.Tests..." -ForegroundColor Yellow
dotnet test UnitTests/CueFinder.Auth.Tests/CueFinder.Auth.Tests.csproj --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) { $testsFailed = $true }

Write-Host ""
Write-Host "Running CueFinder.Database.Tests..." -ForegroundColor Yellow
dotnet test UnitTests/CueFinder.Database.Tests/CueFinder.Database.Tests.csproj --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) { $testsFailed = $true }

Write-Host ""
Write-Host "Running CueFinder.Cues.Tests..." -ForegroundColor Yellow
dotnet test UnitTests/CueFinder.Cues.Tests/CueFinder.Cues.Tests.csproj --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) { $testsFailed = $true }

Write-Host ""
Write-Host "Running CueFinder.CueCases.Tests..." -ForegroundColor Yellow
dotnet test UnitTests/CueFinder.CueCases.Tests/CueFinder.CueCases.Tests.csproj --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) { $testsFailed = $true }

Write-Host ""
Write-Host "Running CueFinder.Extensions.Tests..." -ForegroundColor Yellow
dotnet test UnitTests/CueFinder.Extensions.Tests/CueFinder.Extensions.Tests.csproj --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) { $testsFailed = $true }

# Run Integration Tests
Write-Host ""
Write-Host "STEP 2: Running Integration Tests" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

& .\run-integration-tests.ps1
if ($LASTEXITCODE -ne 0) { $testsFailed = $true }

# Final Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Complete Test Suite Summary" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

if (-not $testsFailed) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
}
