#!/bin/bash
# Setup Security Tests on Production Server
# Run this ON the production server as cuefinder user

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}║     🔒 Production Server Security Test Setup 🔒           ║${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Node.js not found. Installing...${NC}"
    echo -e "${RED}   This requires sudo access!${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}   ✓ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

echo ""

# Navigate to app directory
cd /home/cuefinder/app/tests/SecurityTests || {
    echo -e "${RED}✗ tests/SecurityTests directory not found!${NC}"
    echo -e "${YELLOW}  Creating directory and copying tests...${NC}"
    exit 1
}

echo -e "${YELLOW}📦 Installing test dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${CYAN}🔍 Running Security Tests...${NC}"
echo -e "${YELLOW}   Target: http://localhost:5000 (direct backend)${NC}"
echo ""

# Run tests against localhost (bypasses firewall)
API_URL=http://localhost:5000 node api-security-tests.js

echo ""
echo -e "${GREEN}✅ Tests completed!${NC}"
echo ""
echo -e "${CYAN}📊 View report:${NC}"
LATEST_REPORT=$(ls -t security-report-*.json | head -1)
if [ -n "$LATEST_REPORT" ]; then
    echo "   cat $LATEST_REPORT"
    echo ""
    echo -e "${CYAN}Summary:${NC}"
    cat "$LATEST_REPORT" | grep -A 10 '"summary"'
fi
