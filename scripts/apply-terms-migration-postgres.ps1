# Script to add terms acceptance columns to Users table (PostgreSQL)
# Run this script to apply the database migration

Write-Host "🔄 Adding Terms Acceptance columns to Users table (PostgreSQL)..." -ForegroundColor Cyan

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationFile = Join-Path $scriptDir "add-terms-acceptance-columns-postgres.sql"

# Check if SQL file exists
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

# Database connection details (from docker-compose.yml)
$dbHost = "localhost"
$port = "5432"
$database = "cuefinder"
$username = "postgres"
$password = "admin"

Write-Host "📋 Database: $database" -ForegroundColor Yellow
Write-Host "🔧 Server: $dbHost`:$port" -ForegroundColor Yellow

try {
    # Set PGPASSWORD environment variable
    $env:PGPASSWORD = $password
    
    # Execute the migration using psql
    Write-Host "⏳ Executing migration..." -ForegroundColor Cyan
    
    $output = psql -h $dbHost -p $port -U $username -d $database -f $migrationFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host $output
    } else {
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host $output
        exit 1
    }
} catch {
    Write-Host "❌ Error executing migration: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear the password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎉 Database is ready for terms acceptance feature!" -ForegroundColor Green
