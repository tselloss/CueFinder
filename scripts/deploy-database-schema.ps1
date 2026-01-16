# ============================================================================
# CueFinder Database Schema Update Deployment Script (PowerShell)
# ============================================================================
# Purpose: Complete database initialization and schema update for production
#          deployment with validation and logging.
# Usage: .\deploy-database-schema.ps1 -DbHost localhost -DbPort 5432 -DbName cuefinder -DbUser postgres# 
# ⚠️  SAFETY GUARANTEES:
#     ✓ NO DROP statements - Never deletes columns, tables, or data
#     ✓ NO DELETE statements - Never removes existing data
#     ✓ NO TRUNCATE statements - Never clears tables
#     ✓ Idempotent - Safe to run multiple times
#     ✓ Add-only operations - Only creates new columns/indexes if missing
#     ✓ Update-safe - Updates defaults and constraints without data loss# ============================================================================

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "cuefinder",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "",
    [string]$SqlFilePath = "$PSScriptRoot\database-schema-update.sql"
)

# Set error action
$ErrorActionPreference = "Stop"

# Create log file
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = Join-Path $PSScriptRoot "database-update-${Timestamp}.log"

# Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $LogMessage = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    Write-Log $Message "SUCCESS"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    Write-Log $Message "ERROR"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    Write-Log $Message "WARNING"
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
    Write-Log $Message "INFO"
}

# Header
Write-Host "" 
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║         CueFinder Database Schema Update Script (PowerShell)        ║" -ForegroundColor Blue
Write-Host "║                                                                    ║" -ForegroundColor Blue
Write-Host "║  Database: $DbName" -ForegroundColor Blue
Write-Host "║  Host: $DbHost`:$DbPort" -ForegroundColor Blue
Write-Host "║  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

Write-Log "Starting database schema update process..."

# Check if SQL file exists
if (-not (Test-Path $SqlFilePath)) {
    Write-Error-Custom "Schema update SQL file not found: $SqlFilePath"
    exit 1
}

# Build connection string
$ConnectionString = "Host=$DbHost;Port=$DbPort;Database=$DbName;Username=$DbUser"
if ($DbPassword) {
    $ConnectionString += ";Password=$DbPassword"
}

# Check database connection
Write-Info "Verifying database connection..."
try {
    $PgCommand = "SELECT 1"
    if ($DbPassword) {
        $Env:PGPASSWORD = $DbPassword
    }
    
    $ConnectTest = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT 1" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection verified"
    } else {
        Write-Error-Custom "Failed to connect to database: $ConnectTest"
        exit 1
    }
}
catch {
    Write-Error-Custom "Error connecting to database: $_"
    exit 1
}

# Get database status before update
Write-Info "Gathering pre-update database statistics..."
try {
    $BeforeTables = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    $BeforeColumns = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    $BeforeIndexes = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    
    Write-Log "Tables before update: $BeforeTables"
    Write-Log "Columns before update: $BeforeColumns"
    Write-Log "Indexes before update: $BeforeIndexes"
}
catch {
    Write-Warning-Custom "Could not retrieve pre-update statistics: $_"
}

# Run schema update script
Write-Host ""
Write-Info "Executing database schema update..."
try {
    $Output = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SqlFilePath 2>&1
    Add-Content -Path $LogFile -Value $Output
    Write-Success "Schema update script executed successfully"
}
catch {
    Write-Error-Custom "Schema update script execution failed: $_"
    exit 1
}

# Get database status after update
Write-Info "Gathering post-update database statistics..."
try {
    $AfterTables = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    $AfterColumns = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    $AfterIndexes = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    
    Write-Log "Tables after update: $AfterTables"
    Write-Log "Columns after update: $AfterColumns"
    Write-Log "Indexes after update: $AfterIndexes"
}
catch {
    Write-Warning-Custom "Could not retrieve post-update statistics: $_"
}

# Validate specific important columns exist
Write-Host ""
Write-Info "Validating critical schema elements..."

$ValidationsTotal = 0
$ValidationsPassed = 0

function Validate-Column {
    param([string]$Table, [string]$Column)
    global:$ValidationsTotal++
    
    try {
        $Result = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = '$Table' AND column_name = '$Column';" 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
        
        if ($Result -eq "1") {
            Write-Success "✓ $Table.$Column exists"
            global:$ValidationsPassed++
        } else {
            Write-Error-Custom "✗ $Table.$Column NOT FOUND"
        }
    }
    catch {
        Write-Error-Custom "✗ Error validating $Table.$Column: $_"
    }
}

# Validate critical columns
Validate-Column "Posts" "CreatedByUsername"
Validate-Column "Discussions" "CreatedByUsername"
Validate-Column "Users" "Phone"
Validate-Column "Users" "IsPhoneVerified"
Validate-Column "Categories" "IsActive"
Validate-Column "Messages" "IsRead"

Write-Host ""
Write-Log "Validation Results: $ValidationsPassed/$ValidationsTotal checks passed"

# Run data integrity checks
Write-Host ""
Write-Info "Running data integrity checks..."

try {
    $OrphanedPosts = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tc 'SELECT COUNT(*) FROM "Posts" p WHERE NOT EXISTS (SELECT 1 FROM "Discussions" d WHERE d."Id" = p."DiscussionId");' 2>&1 | ForEach-Object { $_.Trim() } | Select-Object -Last 1
    
    if ([int]$OrphanedPosts -gt 0) {
        Write-Warning-Custom "Found $OrphanedPosts orphaned posts (posts without discussions)"
    } else {
        Write-Success "No orphaned posts found"
    }
}
catch {
    Write-Warning-Custom "Could not run data integrity checks: $_"
}

# Final summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                      UPDATE SUMMARY                                ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ Tables:         $BeforeTables → $AfterTables" -ForegroundColor Green
Write-Host "║ Columns:        $BeforeColumns → $AfterColumns" -ForegroundColor Green
Write-Host "║ Indexes:        $BeforeIndexes → $AfterIndexes" -ForegroundColor Green
Write-Host "║ Validations:    $ValidationsPassed/$ValidationsTotal passed" -ForegroundColor Green
Write-Host "║ Log File:       $LogFile" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

if ($ValidationsPassed -eq $ValidationsTotal) {
    Write-Success "Database schema update completed successfully!"
    exit 0
} else {
    Write-Error-Custom "Database schema update completed with validation errors"
    exit 1
}
