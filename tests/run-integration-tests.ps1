# Run Integration Tests with Docker PostgreSQL
# This script starts the test database, runs tests, and cleans up

Write-Host "🧪 CueFinder Integration Tests Runner" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running"
    }
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Navigate to tests directory
Set-Location $PSScriptRoot

# Start test database
Write-Host ""
Write-Host "Starting test database..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while (-not $ready -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $result = docker exec cuefinder-postgres-test pg_isready -U postgres 2>&1
        if ($result -match "accepting connections") {
            $ready = $true
        }
    } catch {
        # Ignore errors
    }
    
    if (-not $ready) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
if ($ready) {
    Write-Host "✓ Database is ready" -ForegroundColor Green
} else {
    Write-Host "✗ Database failed to start" -ForegroundColor Red
    docker-compose -f docker-compose.test.yml logs
    docker-compose -f docker-compose.test.yml down -v
    exit 1
}

# Export environment variables for tests
$env:TEST_DB_HOST = "127.0.0.1"
$env:TEST_DB_PORT = "5433"
$env:TEST_DB_USER = "postgres"
$env:TEST_DB_PASSWORD = "postgres"

# Run Database Integration Tests
Write-Host ""
Write-Host "Running Database Integration Tests..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan
dotnet test IntegrationTests/CueFinder.Database.IntegrationTests/CueFinder.Database.IntegrationTests.csproj --logger "console;verbosity=normal"
$databaseTestResult = $LASTEXITCODE

# Run Auth Integration Tests
Write-Host ""
Write-Host "Running Auth Integration Tests..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan
dotnet test IntegrationTests/CueFinder.Auth.IntegrationTests/CueFinder.Auth.IntegrationTests.csproj --logger "console;verbosity=normal"
$authTestResult = $LASTEXITCODE

# Run Cues Integration Tests
Write-Host ""
Write-Host "Running Cues Integration Tests..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan
dotnet test IntegrationTests/CueFinder.Cues.IntegrationTests/CueFinder.Cues.IntegrationTests.csproj --logger "console;verbosity=normal"
$cuesTestResult = $LASTEXITCODE

# Run CueCases Integration Tests
Write-Host ""
Write-Host "Running CueCases Integration Tests..." -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan
dotnet test IntegrationTests/CueFinder.CueCases.IntegrationTests/CueFinder.CueCases.IntegrationTests.csproj --logger "console;verbosity=normal"
$cueCasesTestResult = $LASTEXITCODE

# Clean up
Write-Host ""
Write-Host "Cleaning up test database..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down -v
Write-Host "✓ Test database stopped and removed" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($databaseTestResult -eq 0) {
    Write-Host "✓ Database Integration Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Database Integration Tests: FAILED" -ForegroundColor Red
}

if ($authTestResult -eq 0) {
    Write-Host "✓ Auth Integration Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Auth Integration Tests: FAILED" -ForegroundColor Red
}

if ($cuesTestResult -eq 0) {
    Write-Host "✓ Cues Integration Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Cues Integration Tests: FAILED" -ForegroundColor Red
}

if ($cueCasesTestResult -eq 0) {
    Write-Host "✓ CueCases Integration Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ CueCases Integration Tests: FAILED" -ForegroundColor Red
}

Write-Host ""
if ($databaseTestResult -eq 0 -and $authTestResult -eq 0 -and $cuesTestResult -eq 0 -and $cueCasesTestResult -eq 0) {
    Write-Host "🎉 All integration tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some integration tests failed" -ForegroundColor Red
    exit 1
}
