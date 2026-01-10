# Apply Terms Fields Migration to Database
# This script adds AcceptedTerms and AcceptedTermsAt columns to the Users table

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Adding Terms Fields to Database" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "add-terms-fields-to-database.sql"

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

# Database connection parameters
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "cuefinder"
$dbUser = "postgres"
$dbPassword = "postgres"

Write-Host "📋 Migration Details:" -ForegroundColor Yellow
Write-Host "   Database: $dbName" -ForegroundColor Gray
Write-Host "   Host: $dbHost:$dbPort" -ForegroundColor Gray
Write-Host "   SQL File: $sqlFile" -ForegroundColor Gray
Write-Host ""

# Check if PostgreSQL container is running
Write-Host "🔍 Checking if PostgreSQL container is running..." -ForegroundColor Yellow
$containerCheck = docker ps --filter "name=cuefinder_postgres" --filter "status=running" --format "{{.Names}}"

if (-not $containerCheck) {
    Write-Host "❌ PostgreSQL container is not running!" -ForegroundColor Red
    Write-Host "   Please start the database with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ PostgreSQL container is running" -ForegroundColor Green
Write-Host ""

# Read the SQL file content
$sqlContent = Get-Content -Path $sqlFile -Raw

# Apply the migration using docker exec
Write-Host "🚀 Applying migration..." -ForegroundColor Yellow
Write-Host ""

try {
    # Execute the SQL using psql in the container
    $result = docker exec -i cuefinder_postgres psql -U $dbUser -d $dbName -c "$sqlContent" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Result:" -ForegroundColor Cyan
        Write-Host $result
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "❌ Error executing migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ Terms fields added to database" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New columns added:" -ForegroundColor Yellow
Write-Host "  • AcceptedTerms (BOOLEAN)" -ForegroundColor Gray
Write-Host "  • AcceptedTermsAt (TIMESTAMP)" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ All new registrations will now save terms acceptance data" -ForegroundColor Green
