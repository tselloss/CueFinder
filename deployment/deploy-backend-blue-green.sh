#!/bin/bash
#
# Blue-Green Deployment Script for CueFinder Backend
# Enables zero-downtime deployments by running two versions in parallel
#
# Usage: ./deploy-backend-blue-green.sh [--skip-build] [--skip-healthcheck]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_PATH="${APP_PATH:-.}"
DEPLOYMENT_STATE_FILE="${APP_PATH}/.deployment/active_slot"
BACKEND_UPSTREAM_FILE="${APP_PATH}/.deployment/backend-upstream.conf"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=2
DRAIN_TIMEOUT=30

# Parse arguments
SKIP_BUILD=false
SKIP_HEALTHCHECK=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-healthcheck)
            SKIP_HEALTHCHECK=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Utility functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Ensure deployment directory exists
mkdir -p "$(dirname "$DEPLOYMENT_STATE_FILE")"
touch "$BACKEND_UPSTREAM_FILE"

# Determine which slot is active (blue or green)
if [ -f "$DEPLOYMENT_STATE_FILE" ]; then
    ACTIVE_SLOT=$(cat "$DEPLOYMENT_STATE_FILE")
else
    ACTIVE_SLOT="blue"
    echo "blue" > "$DEPLOYMENT_STATE_FILE"
fi

# Determine standby slot
if [ "$ACTIVE_SLOT" = "blue" ]; then
    STANDBY_SLOT="green"
    ACTIVE_PORT=5001
    STANDBY_PORT=5002
else
    STANDBY_SLOT="blue"
    ACTIVE_PORT=5002
    STANDBY_PORT=5001
fi

print_header "🚀 CueFinder Backend Blue-Green Deployment"
echo ""
echo "Active Slot:  $ACTIVE_SLOT (serving on port $ACTIVE_PORT)"
echo "Standby Slot: $STANDBY_SLOT (deploying to port $STANDBY_PORT)"
echo ""

# Step 1: Pull latest code
print_step "Pulling latest code..."
cd "$APP_PATH"
git fetch origin
git checkout release
git reset --hard origin/release
print_success "Code updated"
echo ""

# Step 2: Build new version
if [ "$SKIP_BUILD" = false ]; then
    print_step "Building backend for $STANDBY_SLOT slot..."
    
    if ! docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend-$STANDBY_SLOT; then
        print_error "Build failed!"
        exit 1
    fi
    
    print_success "Build completed"
    echo ""
else
    print_step "Skipping build (--skip-build flag)"
    echo ""
fi

# Step 3: Start standby container
print_step "Starting $STANDBY_SLOT container..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend-$STANDBY_SLOT

# Wait for container to be running
sleep 3
print_success "$STANDBY_SLOT container started"
echo ""

# Step 4: Health check
if [ "$SKIP_HEALTHCHECK" = false ]; then
    print_step "Running health checks on $STANDBY_SLOT (port $STANDBY_PORT)..."
    
    HEALTH_CHECK_PASSED=false
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -sf "http://localhost:$STANDBY_PORT/health" > /dev/null 2>&1; then
            HEALTH_CHECK_PASSED=true
            break
        fi
        
        if [ $((i % 5)) -eq 0 ]; then
            echo -ne "${YELLOW}  Attempt $i/$HEALTH_CHECK_RETRIES...${NC}\r"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    if [ "$HEALTH_CHECK_PASSED" = false ]; then
        print_error "Health check failed after ${HEALTH_CHECK_RETRIES}s!"
        echo ""
        echo "Container logs:"
        docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend-$STANDBY_SLOT | tail -20
        
        print_step "Cleaning up failed deployment..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans backend-$STANDBY_SLOT 2>/dev/null || true
        
        exit 1
    fi
    
    print_success "Health check passed"
    echo ""
else
    print_step "Skipping health checks (--skip-healthcheck flag)"
    echo ""
fi

# Step 5: Graceful drain of active slot
print_step "Graceful shutdown of $ACTIVE_SLOT slot (${DRAIN_TIMEOUT}s grace period)..."

# Create shutdown signal for graceful shutdown
docker exec -d cuefinder-backend-$ACTIVE_SLOT-prod /bin/sh -c 'touch /tmp/shutdown-signal' 2>/dev/null || true

# Wait for graceful shutdown
sleep $DRAIN_TIMEOUT
print_success "Graceful drain completed"
echo ""

# Step 6: Switch traffic
print_step "Switching traffic to $STANDBY_SLOT slot..."
echo "$STANDBY_SLOT" > "$DEPLOYMENT_STATE_FILE"

# Write upstream target for nginx to pick up active slot
cat > "$BACKEND_UPSTREAM_FILE" <<EOF
upstream backend_upstream {
    server cuefinder-backend-$STANDBY_SLOT-prod:5000;
}
EOF

# If using Nginx, reload it to pick up the new upstream
if command -v nginx &> /dev/null; then
    nginx -s reload 2>/dev/null || true
fi

# If running inside docker-compose with nginx service, trigger reload there as well
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T nginx nginx -s reload 2>/dev/null || true

print_success "Traffic switched"
echo ""

# Step 7: Stop active container (keep for quick rollback)
print_step "Stopping old $ACTIVE_SLOT container (keeping for rollback)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend-$ACTIVE_SLOT

print_success "Old container stopped but preserved"
echo ""

# Step 8: Cleanup old containers after delay
print_step "Scheduling old container cleanup in 5 minutes..."
(sleep 300 && docker compose -f docker-compose.yml -f docker-compose.prod.yml rm -f backend-$ACTIVE_SLOT) &

echo ""
print_header "✅ Deployment Complete"
echo ""
echo "New Version: $STANDBY_SLOT"
echo "Uptime:      Minimal (< 1 second of traffic switch)"
echo "Rollback:    Available for 5 minutes"
echo ""
echo "To monitor:"
echo "  docker compose ps"
echo "  docker logs cuefinder-backend-$STANDBY_SLOT -f"
echo ""
echo "To rollback manually:"
echo "  echo '$ACTIVE_SLOT' > .deployment/active_slot"
echo "  nginx -s reload"
echo "  docker compose up -d backend-$ACTIVE_SLOT"
echo ""
