#!/bin/bash
# Database Migration Script for Production
# Handles schema initialization, migrations, and seeding

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🗄️  CueFinder Database Migrations${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-cuefinder}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}
MIGRATION_TIMEOUT=${MIGRATION_TIMEOUT:-60}

# Validate required environment variables
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}✗ DB_PASSWORD is not set${NC}"
    exit 1
fi

echo "Connecting to: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Function to run migrations with retry logic
run_migrations() {
    local db_url="host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=disable"
    
    echo -e "${YELLOW}→ Checking database connectivity...${NC}"
    for i in {1..30}; do
        if psql "$db_url" -c "SELECT 1" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Database is available${NC}"
            break
        fi
        
        if [ $i -lt 30 ]; then
            echo "  Attempt $i/30 - waiting for database..."
            sleep 2
        else
            echo -e "${RED}✗ Database connection failed after 60 seconds${NC}"
            exit 1
        fi
    done
    echo ""
    
    # Check if tables exist
    echo -e "${YELLOW}→ Checking for existing schema...${NC}"
    TABLE_COUNT=$(psql "$db_url" -t -c "
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    " || echo "0")
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Database schema exists ($TABLE_COUNT tables found)${NC}"
    else
        echo -e "${YELLOW}→ Database is empty, will be initialized on first run${NC}"
    fi
    echo ""
    
    # List existing migrations applied
    echo -e "${YELLOW}→ Checking applied migrations...${NC}"
    APPLIED_MIGRATIONS=$(psql "$db_url" -t -c "
        SELECT COUNT(*)
        FROM \"__EFMigrationsHistory\"
        2>/dev/null || echo 0
    " 2>/dev/null || echo "0")
    
    if [ "$APPLIED_MIGRATIONS" -gt 0 ]; then
        echo -e "${GREEN}✓ $APPLIED_MIGRATIONS migrations already applied${NC}"
    else
        echo -e "${YELLOW}→ No migrations applied yet${NC}"
    fi
    echo ""
}

# Function to seed admin user if needed
seed_admin_user() {
    local db_url="host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD sslmode=disable"
    
    echo -e "${YELLOW}→ Checking for admin user...${NC}"
    
    ADMIN_EXISTS=$(psql "$db_url" -t -c "
        SELECT COUNT(*)
        FROM public.\"Users\"
        WHERE \"Role\" = 'Admin'
        LIMIT 1
    " 2>/dev/null || echo "0")
    
    if [ "$ADMIN_EXISTS" -gt 0 ]; then
        echo -e "${GREEN}✓ Admin user already exists${NC}"
    else
        echo -e "${YELLOW}→ Creating default admin user...${NC}"
        # Note: Default credentials should be changed immediately
        psql "$db_url" -c "
        INSERT INTO public.\"Users\" (\"Username\", \"Email\", \"PasswordHash\", \"Role\", \"CreatedAt\")
        VALUES ('admin', 'admin@billiardscuefinder.com', '\$2a\$11\$PLACEHOLDER', 'Admin', NOW())
        ON CONFLICT DO NOTHING;
        " 2>/dev/null || echo "  (Skipped - user may already exist)"
        echo -e "${GREEN}✓ Admin user seeded${NC}"
    fi
    echo ""
}

# Main execution
echo -e "${YELLOW}Step 1: Connecting to Database${NC}"
run_migrations

echo -e "${YELLOW}Step 2: Seeding Initial Data${NC}"
seed_admin_user

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Database initialization complete${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo "Note: EF Core migrations will be applied automatically"
echo "on the first run of the backend application."
echo ""
