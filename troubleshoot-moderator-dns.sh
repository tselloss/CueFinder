#!/bin/bash

# Moderator DNS Troubleshooting Script
# Usage: ./troubleshoot-moderator-dns.sh

set -e

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

echo -e "${BLUE}=== CueFinder Moderator DNS Troubleshooting ===${RESET}\n"

# Check if Docker is running
echo -e "${YELLOW}[1/8] Checking if Docker is running...${RESET}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${RESET}"
    exit 1
fi
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker daemon not running${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${RESET}\n"

# Check if containers are running
echo -e "${YELLOW}[2/8] Checking if required containers are running...${RESET}"
if ! docker ps --filter "name=cuefinder-moderator-prod" --format "{{.Names}}" | grep -q cuefinder-moderator-prod; then
    echo -e "${RED}✗ Moderator container not running${RESET}"
    echo "  Start with: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d moderator"
    exit 1
fi
if ! docker ps --filter "name=cuefinder-opennsfw-prod" --format "{{.Names}}" | grep -q cuefinder-opennsfw-prod; then
    echo -e "${RED}✗ OpenNSFW container not running${RESET}"
    echo "  Start with: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d opennsfw"
    exit 1
fi
echo -e "${GREEN}✓ Both moderator and opennsfw containers are running${RESET}\n"

# Check network connectivity
echo -e "${YELLOW}[3/8] Checking network connectivity...${RESET}"
if docker exec cuefinder-moderator-prod ping -c 1 cuefinder-opennsfw-prod > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Moderator can ping OpenNSFW${RESET}"
else
    echo -e "${RED}✗ Moderator cannot ping OpenNSFW${RESET}"
    echo "  The containers may not be on the same network"
fi
echo ""

# Check DNS resolution
echo -e "${YELLOW}[4/8] Checking DNS resolution...${RESET}"
RESULT=$(docker exec cuefinder-moderator-prod nslookup cuefinder-opennsfw-prod 2>&1)
if echo "$RESULT" | grep -q "Address"; then
    echo -e "${GREEN}✓ DNS resolution successful${RESET}"
    echo "  $(echo "$RESULT" | grep "Address")"
else
    echo -e "${RED}✗ DNS resolution failed${RESET}"
    echo "$RESULT"
fi
echo ""

# Check HTTP connectivity
echo -e "${YELLOW}[5/8] Checking HTTP connectivity to OpenNSFW...${RESET}"
if docker exec cuefinder-moderator-prod curl -s -X GET http://cuefinder-opennsfw-prod:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTP connection to OpenNSFW successful${RESET}"
else
    echo -e "${RED}✗ HTTP connection to OpenNSFW failed${RESET}"
    echo "  Checking OpenNSFW logs..."
    docker logs cuefinder-opennsfw-prod --tail 20
fi
echo ""

# Check moderator environment
echo -e "${YELLOW}[6/8] Checking moderator environment variables...${RESET}"
NUDES_URL=$(docker exec cuefinder-moderator-prod printenv | grep "Moderation__NudeNetUrl" || echo "NOT SET")
if [[ "$NUDES_URL" == *"cuefinder-opennsfw-prod:8000"* ]]; then
    echo -e "${GREEN}✓ Moderation__NudeNetUrl is correctly configured${RESET}"
    echo "  $NUDES_URL"
else
    echo -e "${RED}✗ Moderation__NudeNetUrl is not correctly configured${RESET}"
    echo "  Current: $NUDES_URL"
    echo "  Expected: Moderation__NudeNetUrl=http://cuefinder-opennsfw-prod:8000"
fi
echo ""

# Check moderator logs
echo -e "${YELLOW}[7/8] Checking moderator application logs...${RESET}"
MODERATOR_LOGS=$(docker logs cuefinder-moderator-prod --tail 30 2>&1 | grep -i "nudenet\|dns\|error\|fail" || echo "No relevant errors found")
if [[ "$MODERATOR_LOGS" != "No relevant errors found" ]]; then
    echo -e "${YELLOW}Moderator logs (last 30 lines filtered):${RESET}"
    docker logs cuefinder-moderator-prod --tail 30 2>&1 | grep -i "nudenet\|dns\|error\|fail" || echo "No matching lines"
else
    echo -e "${GREEN}✓ No obvious errors in moderator logs${RESET}"
fi
echo ""

# Check network details
echo -e "${YELLOW}[8/8] Checking Docker network details...${RESET}"
NETWORK_NAME=$(docker inspect cuefinder-moderator-prod --format='{{.HostConfig.NetworkMode}}')
echo "Moderator network mode: $NETWORK_NAME"

if [[ "$NETWORK_NAME" == "cuefinder-network" ]]; then
    echo -e "${GREEN}✓ Moderator is on the correct network${RESET}"
    echo ""
    echo "Containers on network:"
    docker network inspect cuefinder-network --format='{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{println}}{{end}}'
else
    echo -e "${RED}✗ Moderator is on the wrong network: $NETWORK_NAME${RESET}"
fi
echo ""

# Summary and recommendations
echo -e "${BLUE}=== Summary ===${RESET}"
echo "If DNS still fails, try these solutions in order:"
echo ""
echo "1. Restart all containers:"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo ""
echo "2. Rebuild and restart:"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
echo "3. Clear network and retry:"
echo "   docker network rm cuefinder-network || true"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
echo "4. Check for resource constraints:"
echo "   docker stats --no-stream"
echo ""
echo "5. Check Docker daemon logs:"
echo "   journalctl -u docker -n 50 -f  # Linux"
echo "   tail -f /var/log/docker.log     # macOS/Docker Desktop"
