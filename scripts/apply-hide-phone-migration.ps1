# Script to add HidePhone column to Users table
# Run this script to apply the database migration

Write-Host "🔄 Adding HidePhone column to Users table..." -ForegroundColor Cyan

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationFile = Join-Path $scriptDir "add-hide-phone-column.sql"

# Check if SQL file exists
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

# Database connection details (update these as needed)
$server = "localhost,1433"
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
        Write-Host "   - Added HidePhone column to Users table" -ForegroundColor Green
        Write-Host "   - Default value set to 0 (phone visible)" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error executing migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database is ready for phone privacy feature!" -ForegroundColor Green
