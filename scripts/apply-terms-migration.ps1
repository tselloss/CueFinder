# Script to add terms acceptance columns to Users table
# Run this script to apply the database migration

Write-Host "🔄 Adding Terms Acceptance columns to Users table..." -ForegroundColor Cyan

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationFile = Join-Path $scriptDir "add-terms-acceptance-columns.sql"

# Check if SQL file exists
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

# Database connection details (update these as needed)
$server = "localhost,5432"
$database = "CueFinderDB"
$username = "sa"
$password = "YourStrong@Passw0rd"

Write-Host "📋 Database: $database" -ForegroundColor Yellow
Write-Host "🔧 Server: $server" -ForegroundColor Yellow

try {
    # Execute the migration using sqlcmd
    Write-Host "⏳ Executing migration..." -ForegroundColor Cyan
    
    sqlcmd -S $server -d $database -U $username -P $password -i $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host "   - Added AcceptedTerms column" -ForegroundColor Green
        Write-Host "   - Added AcceptedTermsAt column" -ForegroundColor Green
        Write-Host "   - Updated existing users" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error executing migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database is ready for terms acceptance feature!" -ForegroundColor Green
