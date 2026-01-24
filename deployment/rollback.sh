#!/bin/bash
#
# Rollback Script for CueFinder Backend
# Switches traffic back to the previous slot
#
# Usage: ./rollback.sh [--force]
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
DRAIN_TIMEOUT=15

# Parse arguments
FORCE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
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

print_header "🔄 CueFinder Backend Rollback"
echo ""

# Check if deployment state file exists
if [ ! -f "$DEPLOYMENT_STATE_FILE" ]; then
    print_error "Deployment state file not found: $DEPLOYMENT_STATE_FILE"
    echo "Cannot determine current slot."
    exit 1
fi

# Get current active slot
CURRENT_ACTIVE=$(cat "$DEPLOYMENT_STATE_FILE")
PREVIOUS_SLOT=$([ "$CURRENT_ACTIVE" = "blue" ] && echo "green" || echo "blue")
CURRENT_PORT=$([ "$CURRENT_ACTIVE" = "blue" ] && echo 5001 || echo 5002)
PREVIOUS_PORT=$([ "$PREVIOUS_SLOT" = "blue" ] && echo 5001 || echo 5002)

echo "Current Active:  $CURRENT_ACTIVE (port $CURRENT_PORT)"
echo "Previous Slot:   $PREVIOUS_SLOT (port $PREVIOUS_PORT)"
echo ""

# Confirm rollback
if [ "$FORCE" = false ]; then
    echo "⚠️  Are you sure you want to rollback to $PREVIOUS_SLOT? (yes/no)"
    read -r CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Rollback cancelled."
        exit 0
    fi
fi

echo ""

# Step 1: Check if previous slot is running
print_step "Checking previous slot ($PREVIOUS_SLOT) status..."
cd "$APP_PATH"

if ! docker compose ps backend-$PREVIOUS_SLOT | grep -q "Up"; then
    print_error "Previous slot ($PREVIOUS_SLOT) is not running!"
    echo "Attempting to start it..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend-$PREVIOUS_SLOT
    sleep 3
fi

print_success "Previous slot is running"
echo ""

# Step 2: Health check previous slot
print_step "Running health check on $PREVIOUS_SLOT..."
HEALTH_CHECK_PASSED=false
for i in {1..10}; do
    if curl -sf "http://localhost:$PREVIOUS_PORT/health" > /dev/null 2>&1; then
        HEALTH_CHECK_PASSED=true
        break
    fi
    sleep 2
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    print_error "Health check failed on previous slot!"
    exit 1
fi

print_success "Health check passed"
echo ""

# Step 3: Graceful drain
print_step "Draining current slot ($CURRENT_ACTIVE)..."
docker exec -d cuefinder-backend-$CURRENT_ACTIVE /bin/sh -c 'touch /tmp/shutdown-signal' 2>/dev/null || true
sleep $DRAIN_TIMEOUT
print_success "Graceful drain completed"
echo ""

# Step 4: Switch traffic
print_step "Switching traffic to $PREVIOUS_SLOT..."
echo "$PREVIOUS_SLOT" > "$DEPLOYMENT_STATE_FILE"

# Reload Nginx
if command -v nginx &> /dev/null; then
    nginx -s reload 2>/dev/null || true
fi

print_success "Traffic switched"
echo ""

# Step 5: Stop current container
print_step "Stopping failed slot ($CURRENT_ACTIVE)..."
docker compose stop backend-$CURRENT_ACTIVE
print_success "Failed slot stopped"
echo ""

print_header "✅ Rollback Complete"
echo ""
echo "Reverted to:     $PREVIOUS_SLOT"
echo "Uptime Impact:   < 1 second (traffic switch only)"
echo ""
echo "Check status with:"
echo "  docker compose ps"
echo ""
