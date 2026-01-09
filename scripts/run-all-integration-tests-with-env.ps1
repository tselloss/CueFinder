# Script to run all integration tests with proper environment variables
# This ensures database connection works correctly

Write-Host "Setting up test environment variables..." -ForegroundColor Cyan
$env:TEST_DB_HOST = "127.0.0.1"
$env:TEST_DB_PORT = "5433"
$env:TEST_DB_USER = "postgres"
$env:TEST_DB_PASSWORD = "admin"

Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  TEST_DB_HOST: $env:TEST_DB_HOST"
Write-Host "  TEST_DB_PORT: $env:TEST_DB_PORT"
Write-Host "  TEST_DB_USER: $env:TEST_DB_USER"
Write-Host "  TEST_DB_PASSWORD: ****"
Write-Host ""

Write-Host "Running all integration tests..." -ForegroundColor Cyan
dotnet test "$PSScriptRoot\..\CueFinderBE\CueFinderBE.sln" --filter "FullyQualifiedName~IntegrationTests" --logger "console;verbosity=normal"

$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed. Exit code: $exitCode" -ForegroundColor Red
}

exit $exitCode
