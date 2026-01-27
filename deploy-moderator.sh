#!/bin/bash

# Smart deployment script for CueFinderModerator - only rebuilds when changes are detected
# Usage: ./deploy-moderator.sh [--force] [--no-build]

set -e

# Configuration
MODERATION_FOLDER="SolutionLibraries/CueFinderModerator"
CONTAINER_NAME="cuefinder-moderator"
IMAGE_NAME="cuefinder-moderator"
LOG_FILE="moderator-deploy.log"
STATE_FILE=".moderator-deploy-state"
FORCE_BUILD=false
NO_BUILD=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_BUILD=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Helper function to log
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Helper function to calculate folder hash
get_folder_hash() {
    find "$MODERATION_FOLDER" -type f \
        ! -path "*/bin/*" ! -path "*/obj/*" ! -path "*/.vs/*" \
        ! -name "*.dll" ! -name "*.pdb" \
        -exec sha256sum {} \; | sort | sha256sum | awk '{print $1}'
}

log "INFO" "========== CueFinderModerator Deployment Started =========="
log "INFO" "Checking for changes in $MODERATION_FOLDER folder..."

# Calculate current folder hash
CURRENT_HASH=$(get_folder_hash)
log "INFO" "Current folder hash: $CURRENT_HASH"

# Read previous hash
PREVIOUS_HASH=""
if [ -f "$STATE_FILE" ]; then
    PREVIOUS_HASH=$(cat "$STATE_FILE")
    log "INFO" "Previous folder hash: $PREVIOUS_HASH"
else
    log "INFO" "State file not found - first deployment"
fi

# Check if rebuild is needed
NEEDS_REBUILD=false
if [ "$FORCE_BUILD" = true ] || [ "$CURRENT_HASH" != "$PREVIOUS_HASH" ]; then
    NEEDS_REBUILD=true
fi

# Build if needed
if [ "$NEEDS_REBUILD" = true ] && [ "$NO_BUILD" != true ]; then
    log "INFO" "Changes detected! Building new image..."
    log "INFO" "Building Docker image: $IMAGE_NAME"
    
    if docker build -f "$MODERATION_FOLDER/Dockerfile" -t "${IMAGE_NAME}:latest" .; then
        log "INFO" "✅ Docker image built successfully"
        echo "$CURRENT_HASH" > "$STATE_FILE"
        log "INFO" "Updated state file with new hash"
    else
        log "ERROR" "❌ Docker build failed!"
        exit 1
    fi
elif [ "$NO_BUILD" = true ]; then
    log "INFO" "Skipping build (--no-build flag)"
else
    log "INFO" "✅ No changes detected - skipping rebuild"
fi

# Stop and remove existing container
log "INFO" "Checking for existing container..."
if docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    log "INFO" "Stopping existing container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    log "INFO" "✅ Container stopped and removed"
fi

# Start with docker-compose
log "INFO" "Starting container with docker-compose..."
if docker-compose up -d "$CONTAINER_NAME"; then
    log "INFO" "✅ Container started"
else
    log "ERROR" "❌ Docker compose failed!"
    exit 1
fi

# Wait for container to be healthy
log "INFO" "Waiting for container to become healthy..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "none")
    
    if [ "$HEALTH" = "healthy" ]; then
        log "INFO" "✅ Container is healthy!"
        break
    elif [ "$HEALTH" = "unhealthy" ]; then
        log "ERROR" "❌ Container is unhealthy!"
        docker logs "$CONTAINER_NAME"
        exit 1
    fi
    
    log "INFO" "Waiting... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log "WARN" "⚠ Container health check timeout - checking logs..."
    docker logs "$CONTAINER_NAME"
fi

# Final status
log "INFO" "========== Deployment Completed Successfully =========="
log "INFO" "Container Status:"
docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
