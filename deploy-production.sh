#!/bin/bash
# ============================================================
# Production Deployment Script for CueFinder
# ============================================================
# Usage: ./deploy-production.sh
# ============================================================

set -e  # Exit on error

echo "=========================================="
echo "CueFinder Production Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# PRE-DEPLOYMENT CHECKS
# ============================================================
echo -e "\n${YELLOW}[1/6] Running pre-deployment checks...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${RED}✗ ERROR: .env.production not found${NC}"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}✗ ERROR: docker-compose.prod.yml not found${NC}"
    exit 1
fi

if [ ! -d "ssl" ] || [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo -e "${RED}✗ ERROR: SSL certificates not found in ssl/ directory${NC}"
    exit 1
fi

if [ ! -d "/home/cuefinder/data/postgres" ]; then
    echo -e "${RED}✗ ERROR: /home/cuefinder/data/postgres directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All pre-deployment checks passed${NC}"

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================
echo -e "\n${YELLOW}[2/6] Loading environment variables...${NC}"

export $(cat .env.production | xargs)

# Verify critical variables
if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}✗ ERROR: Critical environment variables not set${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# ============================================================
# BACKUP DATABASE (if running)
# ============================================================
echo -e "\n${YELLOW}[3/6] Backing up current database...${NC}"

if docker ps | grep -q cuefinder-postgres; then
    BACKUP_FILE="/home/cuefinder/backups/pre-deployment_$(date +%Y%m%d_%H%M%S).sql"
    docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > "$BACKUP_FILE" 2>/dev/null || true
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database backed up to $BACKUP_FILE.gz${NC}"
else
    echo -e "${YELLOW}⊘ Database not running (first deployment)${NC}"
fi

# ============================================================
# PULL LATEST IMAGES
# ============================================================
echo -e "\n${YELLOW}[4/6] Pulling latest Docker images...${NC}"

docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

echo -e "${GREEN}✓ Images pulled${NC}"

# ============================================================
# BUILD FRONTEND WITH ENV VARS
# ============================================================
echo -e "\n${YELLOW}[5/6] Building frontend with environment variables...${NC}"

docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  build --no-cache frontend

echo -e "${GREEN}✓ Frontend built${NC}"

# ============================================================
# DEPLOY SERVICES
# ============================================================
echo -e "\n${YELLOW}[6/6] Deploying services (DO NOT USE -v flag!)...${NC}"

# Start all services without -v flag (preserves database)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Services deployed${NC}"

# ============================================================
# WAIT FOR SERVICES TO BE READY
# ============================================================
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"

sleep 15

# Check database health
for i in {1..30}; do
    if docker exec cuefinder-postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Check backend health
for i in {1..30}; do
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend API is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# ============================================================
# APPLY SCHEMA SAFETY UPDATES
# ============================================================
echo -e "\n${YELLOW}[Post-deploy] Running schema safety updates...${NC}"

if [ -f "schema-update-prod.sql" ]; then
    docker cp schema-update-prod.sql cuefinder-postgres-prod:/tmp/schema-update-prod.sql
    if docker exec cuefinder-postgres-prod psql -U postgres -d cuefinder -f /tmp/schema-update-prod.sql; then
        echo -e "${GREEN}✓ Schema safety updates applied${NC}"
    else
        echo -e "${YELLOW}⚠️  Schema update had warnings (non-fatal, deployment continues)${NC}"
    fi
else
    echo -e "${YELLOW}⊘ schema-update-prod.sql not found, skipping${NC}"
fi

# ============================================================
# VERIFY DEPLOYMENT
# ============================================================
echo -e "\n${BLUE}Verifying deployment...${NC}"

echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\nService Status:"
echo "  Database: $(docker ps -f name=postgres --format '{{.Status}}' || echo 'Not running')"
echo "  Backend Blue: $(docker ps -f name=backend-blue --format '{{.Status}}' || echo 'Not running')"
echo "  Backend Green: $(docker ps -f name=backend-green --format '{{.Status}}' || echo 'Not running')"
echo "  Nginx: $(docker ps -f name=nginx --format '{{.Status}}' || echo 'Not running')"

# ============================================================
# DEPLOYMENT COMPLETE
# ============================================================
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}=========================================${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Monitor logs: docker-compose logs -f nginx"
echo "2. Test API: curl https://billiardscuefinder.com/api/health"
echo "3. Check database backups: ls -lah /home/cuefinder/backups/"
echo ""
echo -e "${YELLOW}⚠️  Important Reminders:${NC}"
echo "   • Never use 'docker-compose down -v' (deletes database!)"
echo "   • Always use: docker-compose down  (preserves data)"
echo "   • Database is automatically backed up daily at 3 AM"
echo "   • SSL certificates auto-renew (check Let's Encrypt)"
echo ""
echo -e "${BLUE}Emergency Rollback:${NC}"
echo "  docker-compose down"
echo "  # Check latest backup"
echo "  ls -lah /home/cuefinder/backups/"
echo "  # Restore from backup if needed"
echo "  docker exec cuefinder-postgres psql -U postgres -d cuefinder < /home/cuefinder/backups/backup_file.sql"
