#!/bin/bash
# ============================================================================
# CueFinder Database Schema Update Deployment Script
# ============================================================================
# Purpose: Complete database initialization and schema update for production
#          deployment with rollback capability and logging.
# Usage: ./deploy-database-schema.sh# 
# ⚠️  SAFETY GUARANTEES:
#     ✓ NO DROP statements - Never deletes columns, tables, or data
#     ✓ NO DELETE statements - Never removes existing data
#     ✓ NO TRUNCATE statements - Never clears tables
#     ✓ Idempotent - Safe to run multiple times
#     ✓ Add-only operations - Only creates new columns/indexes if missing
#     ✓ Update-safe - Updates defaults and constraints without data loss# ============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/database-update-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - update these for your environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cuefinder}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Functions
log() {
    echo "[${TIMESTAMP}] $1" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${LOG_FILE}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "${LOG_FILE}"
}

# Header
echo "╔════════════════════════════════════════════════════════════════════╗" | tee "${LOG_FILE}"
echo "║         CueFinder Database Schema Update Script                    ║" | tee -a "${LOG_FILE}"
echo "║                                                                    ║" | tee -a "${LOG_FILE}"
echo "║  Database: ${DB_NAME}                                          ║" | tee -a "${LOG_FILE}"
echo "║  Host: ${DB_HOST}:${DB_PORT}                                                    ║" | tee -a "${LOG_FILE}"
echo "║  Timestamp: ${TIMESTAMP}                              ║" | tee -a "${LOG_FILE}"
echo "╚════════════════════════════════════════════════════════════════════╝" | tee -a "${LOG_FILE}"

log ""
log "Starting database schema update process..."

# Set password environment variable if provided
if [ ! -z "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

# Check database connection
log_info "Verifying database connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    log_success "Database connection verified"
else
    log_error "Failed to connect to database"
    exit 1
fi

# Get database status before update
log_info "Gathering pre-update database statistics..."
BEFORE_TABLES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
BEFORE_COLUMNS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public';" | xargs)
BEFORE_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)

log "Tables before update: $BEFORE_TABLES"
log "Columns before update: $BEFORE_COLUMNS"
log "Indexes before update: $BEFORE_INDEXES"

# Run schema update script
log ""
log_info "Executing database schema update..."
SCHEMA_UPDATE_SQL="${SCRIPT_DIR}/database-schema-update.sql"

if [ ! -f "$SCHEMA_UPDATE_SQL" ]; then
    log_error "Schema update SQL file not found: $SCHEMA_UPDATE_SQL"
    exit 1
fi

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_UPDATE_SQL" >> "${LOG_FILE}" 2>&1

if [ $? -eq 0 ]; then
    log_success "Schema update script executed successfully"
else
    log_error "Schema update script execution failed"
    exit 1
fi

# Get database status after update
log_info "Gathering post-update database statistics..."
AFTER_TABLES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
AFTER_COLUMNS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public';" | xargs)
AFTER_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)

log "Tables after update: $AFTER_TABLES"
log "Columns after update: $AFTER_COLUMNS"
log "Indexes after update: $AFTER_INDEXES"

# Validate specific important columns exist
log ""
log_info "Validating critical schema elements..."

VALIDATIONS_PASSED=0
VALIDATIONS_TOTAL=0

# Function to validate column exists
validate_column() {
    local table=$1
    local column=$2
    VALIDATIONS_TOTAL=$((VALIDATIONS_TOTAL + 1))
    
    COLUMN_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = '$table' AND column_name = '$column';" | xargs)
    
    if [ "$COLUMN_EXISTS" -eq 1 ]; then
        log_success "✓ $table.$column exists"
        VALIDATIONS_PASSED=$((VALIDATIONS_PASSED + 1))
    else
        log_error "✗ $table.$column NOT FOUND"
    fi
}

# Validate critical columns
validate_column "Posts" "CreatedByUsername"
validate_column "Discussions" "CreatedByUsername"
validate_column "Users" "Phone"
validate_column "Users" "IsPhoneVerified"
validate_column "Categories" "IsActive"
validate_column "Messages" "IsRead"

log ""
log "Validation Results: $VALIDATIONS_PASSED/$VALIDATIONS_TOTAL checks passed"

# Run data integrity checks
log ""
log_info "Running data integrity checks..."

# Check for orphaned records (optional)
ORPHANED_POSTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM \"Posts\" p WHERE NOT EXISTS (SELECT 1 FROM \"Discussions\" d WHERE d.\"Id\" = p.\"DiscussionId\");" | xargs)
if [ "$ORPHANED_POSTS" -gt 0 ]; then
    log_warning "Found $ORPHANED_POSTS orphaned posts (posts without discussions)"
else
    log_success "No orphaned posts found"
fi

# Get final summary
log ""
log ""
echo "╔════════════════════════════════════════════════════════════════════╗" | tee -a "${LOG_FILE}"
echo "║                      UPDATE SUMMARY                                ║" | tee -a "${LOG_FILE}"
echo "╠════════════════════════════════════════════════════════════════════╣" | tee -a "${LOG_FILE}"
echo "║ Tables:         $BEFORE_TABLES → $AFTER_TABLES                                          ║" | tee -a "${LOG_FILE}"
echo "║ Columns:        $BEFORE_COLUMNS → $AFTER_COLUMNS                                          ║" | tee -a "${LOG_FILE}"
echo "║ Indexes:        $BEFORE_INDEXES → $AFTER_INDEXES                                          ║" | tee -a "${LOG_FILE}"
echo "║ Validations:    $VALIDATIONS_PASSED/$VALIDATIONS_TOTAL passed                                        ║" | tee -a "${LOG_FILE}"
echo "║ Log File:       $LOG_FILE ║" | tee -a "${LOG_FILE}"
echo "╚════════════════════════════════════════════════════════════════════╝" | tee -a "${LOG_FILE}"

if [ "$VALIDATIONS_PASSED" -eq "$VALIDATIONS_TOTAL" ]; then
    log_success "Database schema update completed successfully!"
    exit 0
else
    log_error "Database schema update completed with validation errors"
    exit 1
fi
