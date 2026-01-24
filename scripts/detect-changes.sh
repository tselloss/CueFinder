#!/bin/bash
#
# Change Detection Script for CueFinder
# Determines which components have changed since the last deployment
#
# Usage: ./detect-changes.sh [--base-ref origin/release] [--head-ref HEAD]
#

# Get base and head references
BASE_REF="${1:-origin/release}"
HEAD_REF="${2:-HEAD}"

# Get list of changed files
CHANGED_FILES=$(git diff "$BASE_REF"..."$HEAD_REF" --name-only 2>/dev/null || echo "")

# Initialize change detection
HAS_BACKEND_CHANGES=false
HAS_FRONTEND_CHANGES=false
HAS_INFRA_CHANGES=false
HAS_DATABASE_CHANGES=false

# Check for backend changes
if echo "$CHANGED_FILES" | grep -qE '^(CueFinderBE|SolutionLibraries|\.github/workflows/deploy-backend\.yml|docker-compose\.(yml|prod\.yml))'; then
    HAS_BACKEND_CHANGES=true
fi

# Check for frontend changes
if echo "$CHANGED_FILES" | grep -qE '^(CueFinderFE|\.github/workflows/deploy-frontend\.yml|docker-compose\.(yml|prod\.yml))'; then
    HAS_FRONTEND_CHANGES=true
fi

# Check for infrastructure changes (moderator, opennsfw)
if echo "$CHANGED_FILES" | grep -qE '^(CueFinderModerator|deployment/.*\.py|deployment/Dockerfile\.nudenet|\.github/workflows/deploy-infra\.yml)'; then
    HAS_INFRA_CHANGES=true
fi

# Check for database changes
if echo "$CHANGED_FILES" | grep -qE '^(init\.sql|scripts/.*\.sql)'; then
    HAS_DATABASE_CHANGES=true
fi

# Output as environment variable format (for GitHub Actions)
echo "backend=$HAS_BACKEND_CHANGES"
echo "frontend=$HAS_FRONTEND_CHANGES"
echo "infra=$HAS_INFRA_CHANGES"
echo "database=$HAS_DATABASE_CHANGES"

# Also output for shell scripting
echo "BACKEND_CHANGES=$HAS_BACKEND_CHANGES"
echo "FRONTEND_CHANGES=$HAS_FRONTEND_CHANGES"
echo "INFRA_CHANGES=$HAS_INFRA_CHANGES"
echo "DATABASE_CHANGES=$HAS_DATABASE_CHANGES"

# Exit with success if any changes detected
if [ "$HAS_BACKEND_CHANGES" = true ] || [ "$HAS_FRONTEND_CHANGES" = true ] || [ "$HAS_INFRA_CHANGES" = true ] || [ "$HAS_DATABASE_CHANGES" = true ]; then
    exit 0
else
    echo "no_changes=true"
    exit 0
fi
