#!/bin/bash
# Pre-Deployment Security Check Script
# Run this before deploying to production to ensure no critical vulnerabilities exist

set -e

echo "🔒 CueFinder Pre-Deployment Security Check"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if application is running
echo "📋 Checking if application is running..."
if ! docker ps | grep -q cuefinder-backend; then
    echo -e "${YELLOW}⚠️  Application not running. Starting...${NC}"
    docker compose up -d
    echo "⏳ Waiting for application to start..."
    sleep 15
fi

# Wait for health check
echo "🏥 Checking application health..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Application health check failed${NC}"
        exit 1
    fi
    sleep 1
done

# Run security tests
echo ""
echo "🔍 Running Security Tests..."
echo "----------------------------"

cd tests/SecurityTests

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set API URL
export API_URL="http://localhost:5000"

# Run API security tests
echo ""
echo "🔐 API Security Tests..."
if node api-security-tests.js; then
    echo -e "${GREEN}✅ API security tests passed${NC}"
else
    echo -e "${RED}❌ API security tests failed${NC}"
    exit 1
fi

# Check results
REPORT=$(ls -t security-report-*.json 2>/dev/null | head -n1)

if [ ! -f "$REPORT" ]; then
    echo -e "${RED}❌ No security report generated${NC}"
    exit 1
fi

# Parse results
TOTAL=$(jq '.summary.total' "$REPORT")
CRITICAL=$(jq '.summary.critical' "$REPORT")
HIGH=$(jq '.summary.high' "$REPORT")
MEDIUM=$(jq '.summary.medium' "$REPORT")
LOW=$(jq '.summary.low' "$REPORT")

echo ""
echo "📊 Security Test Summary"
echo "========================"
echo -e "Total vulnerabilities: ${TOTAL}"
echo -e "Critical: ${RED}${CRITICAL}${NC}"
echo -e "High: ${YELLOW}${HIGH}${NC}"
echo -e "Medium: ${MEDIUM}"
echo -e "Low: ${LOW}"
echo ""

# Check for blocking vulnerabilities
if [ "$CRITICAL" -gt "0" ]; then
    echo -e "${RED}❌ DEPLOYMENT BLOCKED: Critical vulnerabilities found!${NC}"
    echo ""
    echo "Critical vulnerabilities must be fixed before deployment:"
    jq -r '.vulnerabilities[] | select(.severity=="CRITICAL") | "  - [\(.severity)] \(.endpoint // .area): \(.description)"' "$REPORT"
    echo ""
    exit 1
fi

if [ "$HIGH" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  WARNING: High severity vulnerabilities found!${NC}"
    echo ""
    echo "High severity issues detected:"
    jq -r '.vulnerabilities[] | select(.severity=="HIGH") | "  - [\(.severity)] \(.endpoint // .area): \(.description)"' "$REPORT"
    echo ""
    read -p "Continue with deployment anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo -e "${YELLOW}⏸️  Deployment cancelled by user${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Security check passed - Ready for deployment!${NC}"
echo ""
echo "📝 Security report saved: $REPORT"
echo ""
exit 0
