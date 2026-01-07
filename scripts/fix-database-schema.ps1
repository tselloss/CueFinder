# Fix missing Location column in Users table

Write-Host "Fixing database schema - adding Location column to Users table..." -ForegroundColor Cyan

$sqlScript = Get-Content "$PSScriptRoot\add-user-location-column.sql" -Raw

# Execute SQL in the PostgreSQL container
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "$sqlScript"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema fixed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to fix database schema" -ForegroundColor Red
    exit 1
}
