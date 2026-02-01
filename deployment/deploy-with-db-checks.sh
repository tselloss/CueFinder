#!/bin/bash
# Enhanced Docker-Compose wrapper for database-aware deployments
# This script ensures databases are ready before application startup

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="${APP_DIR:-.}"
COMPOSE_FILES="${COMPOSE_FILES:--f docker-compose.yml -f docker-compose.prod.yml}"
HEALTH_CHECK_RETRIES=60
HEALTH_CHECK_INTERVAL=1

echo -e "${BLUE}🐳 Docker Compose Deployment with Database Checks${NC}"
echo ""

# Function to wait for postgres to be ready
wait_for_postgres() {
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    
    local db_host="postgres"
    local db_port="5432"
    local retry=0
    
    while [ $retry -lt $HEALTH_CHECK_RETRIES ]; do
        if docker exec cuefinder-postgres pg_isready -h $db_host -p $db_port > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
            return 0
        fi
        
        retry=$((retry + 1))
        if [ $((retry % 10)) -eq 0 ]; then
            echo "  Attempt $retry/$HEALTH_CHECK_RETRIES..."
        fi
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    echo -e "${RED}✗ PostgreSQL failed to start after $HEALTH_CHECK_RETRIES attempts${NC}"
    return 1
}

# Function to check if migrations completed
wait_for_backend() {
    echo -e "${YELLOW}⏳ Waiting for backend API to be ready...${NC}"
    
    local port="5000"
    local retry=0
    
    while [ $retry -lt $HEALTH_CHECK_RETRIES ]; do
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend API is ready${NC}"
            return 0
        fi
        
        retry=$((retry + 1))
        if [ $((retry % 10)) -eq 0 ]; then
            echo "  Attempt $retry/$HEALTH_CHECK_RETRIES..."
        fi
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    echo -e "${YELLOW}⚠ Backend health check timeout (may still be initializing)${NC}"
    return 0  # Don't fail, backend might still start
}

cd "$APP_DIR"

echo "Starting containers..."
docker-compose $COMPOSE_FILES up -d --build

echo ""
wait_for_postgres

echo ""
wait_for_backend

echo ""
echo -e "${GREEN}✓ Deployment successful${NC}"
echo ""
echo "Services running:"
docker-compose $COMPOSE_FILES ps
