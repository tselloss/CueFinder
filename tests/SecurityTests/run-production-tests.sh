#!/bin/bash
# Quick Security Test Runner for Production Server
# Handles all common scenarios automatically

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}║          🔒 Production Security Test Runner 🔒            ║${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}📡 Checking server connectivity...${NC}"
if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Backend server is responding${NC}"
else
    echo -e "${RED}   ✗ Backend server is not responding${NC}"
    echo -e "${YELLOW}   Starting Docker containers...${NC}"
    docker compose up -d
    echo -e "${YELLOW}   Waiting 15 seconds for services to start...${NC}"
    sleep 15
    
    if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Backend server is now responding${NC}"
    else
        echo -e "${RED}   ✗ Backend server still not responding${NC}"
        echo -e "${RED}   Please check Docker logs: docker compose logs backend${NC}"
        exit 1
    fi
fi

echo ""

# Ask user about rate limiting
echo -e "${CYAN}⚡ Rate Limiting Options:${NC}"
echo "  1) Run with rate limiting (slower, ~3 min, production-like) [DEFAULT]"
echo "  2) Temporarily disable rate limiting (faster, ~30 sec)"
echo ""
read -p "Choose option [1]: " rate_choice
rate_choice=${rate_choice:-1}

if [ "$rate_choice" == "2" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Disabling rate limiting...${NC}"
    echo -e "${RED}   WARNING: Rate limiting will be disabled during tests!${NC}"
    
    # Comment out rate limiting in Program.cs
    sed -i 's/^\(\s*app\.UseRateLimiting\)/\/\/ \1/' CueFinderBE/Program.cs
    
    echo -e "${YELLOW}   Rebuilding backend...${NC}"
    docker compose build backend
    
    echo -e "${YELLOW}   Restarting backend...${NC}"
    docker compose restart backend
    
    echo -e "${YELLOW}   Waiting 15 seconds for backend to restart...${NC}"
    sleep 15
    
    echo -e "${GREEN}   ✓ Rate limiting disabled${NC}"
fi

echo ""
echo -e "${CYAN}🔍 Running Security Tests...${NC}"
echo ""

cd tests/SecurityTests
node api-security-tests.js

echo ""
echo -e "${GREEN}✅ Security tests completed!${NC}"
echo ""

# If rate limiting was disabled, re-enable it
if [ "$rate_choice" == "2" ]; then
    echo -e "${YELLOW}🔄 Re-enabling rate limiting...${NC}"
    
    cd ../..
    sed -i 's/\/\/ \(app\.UseRateLimiting\)/\1/' CueFinderBE/Program.cs
    
    echo -e "${YELLOW}   Rebuilding backend...${NC}"
    docker compose build backend
    
    echo -e "${YELLOW}   Restarting backend...${NC}"
    docker compose restart backend
    
    echo -e "${GREEN}   ✓ Rate limiting re-enabled${NC}"
fi

echo ""
echo -e "${CYAN}📊 View detailed report:${NC}"
echo "   cat tests/SecurityTests/security-report-*.json | jq"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
