#!/bin/bash

# CueFinder Security & Penetration Test Runner (Linux/Mac)
# Runs all security and penetration tests

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default values
API_URL="${API_URL:-http://localhost:5000}"
RUN_API=false
RUN_FILE=false
RUN_AUTH=false
RUN_ZAP=false
RUN_ALL=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api)
            RUN_API=true
            shift
            ;;
        --file)
            RUN_FILE=true
            shift
            ;;
        --auth)
            RUN_AUTH=true
            shift
            ;;
        --zap)
            RUN_ZAP=true
            shift
            ;;
        --all)
            RUN_ALL=true
            shift
            ;;
        --url)
            API_URL="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo -e "${CYAN}CueFinder Security & Penetration Testing Suite${NC}"
            echo ""
            echo "Usage: ./run-security-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --api             Run API security tests (SQL injection, XSS, etc.)"
            echo "  --file            Run file upload security tests"
            echo "  --auth            Run authentication & authorization tests"
            echo "  --zap             Run OWASP ZAP automated scan (requires ZAP running)"
            echo "  --all             Run all security tests"
            echo "  --url <url>       Specify API URL (default: http://localhost:5000)"
            echo "  --verbose         Show detailed output"
            echo ""
            echo "Examples:"
            echo "  ./run-security-tests.sh --all"
            echo "  ./run-security-tests.sh --api --auth"
            echo "  ./run-security-tests.sh --zap --url http://production-url.com"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🔒 CueFinder Security & Penetration Testing Suite${NC}"
echo "================================================================================"
echo ""

# Check if application is running
echo -e "${YELLOW}Checking if application is running...${NC}"
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$API_URL/api/health" | grep -q "200"; then
    echo -e "${GREEN}✅ Application is running at $API_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Cannot reach application at $API_URL${NC}"
    echo -e "${YELLOW}   Make sure your application is running before executing tests${NC}"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Export API URL
export API_URL

# Function to run a test
run_test() {
    local test_name=$1
    local test_script=$2
    local icon=$3
    
    echo ""
    echo -e "${CYAN}$icon Running $test_name...${NC}"
    echo "--------------------------------------------------------------------------------"
    
    start_time=$(date +%s)
    
    cd "$(dirname "$0")"
    if [ "$VERBOSE" = true ]; then
        node "$test_script"
    else
        node "$test_script" 2>&1
    fi
    
    exit_code=$?
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name completed in ${duration}s${NC}"
    else
        echo -e "${RED}❌ $test_name failed after ${duration}s${NC}"
    fi
}

# Run selected tests
tests_run=0

if [ "$RUN_ALL" = true ] || [ "$RUN_API" = true ]; then
    run_test "API Security Tests" "api-security-tests.js" "🔍"
    ((tests_run++))
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_FILE" = true ]; then
    run_test "File Upload Security Tests" "file-upload-security-tests.js" "📁"
    ((tests_run++))
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_AUTH" = true ]; then
    run_test "Authentication & Authorization Tests" "auth-penetration-tests.js" "🔐"
    ((tests_run++))
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_ZAP" = true ]; then
    echo ""
    echo -e "${CYAN}🕷️  Running OWASP ZAP Security Scan...${NC}"
    echo "--------------------------------------------------------------------------------"
    echo ""
    echo -e "${YELLOW}⚠️  Note: OWASP ZAP must be running for this scan to work${NC}"
    echo -e "${YELLOW}   Download: https://www.zaproxy.org/download/${NC}"
    echo -e "${YELLOW}   Start with: zap.sh -daemon -port 8080 -config api.key=changeme${NC}"
    echo ""
    
    read -p "Is ZAP running? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_test "OWASP ZAP Scan" "zap-integration.js" "🕷️"
        ((tests_run++))
    else
        echo -e "${YELLOW}⏭️  Skipping ZAP scan${NC}"
    fi
fi

# If no tests specified, show help
if [ $tests_run -eq 0 ]; then
    echo -e "${YELLOW}No tests specified. Use --help for usage information.${NC}"
    exit 0
fi

# Summary
echo ""
echo "================================================================================"
echo -e "${CYAN}📊 Test Execution Summary${NC}"
echo "================================================================================"
echo ""
echo "Tests executed: $tests_run"
echo "Target URL: $API_URL"
echo ""

# List generated reports
echo -e "${CYAN}📄 Generated Reports:${NC}"
find "$(dirname "$0")" -name "*-report-*.json" -o -name "*-report-*.html" | 
    head -n 15 | 
    while read -r file; do
        size=$(du -h "$file" | cut -f1)
        echo -e "${GRAY}   $(basename "$file") ($size)${NC}"
    done

echo ""
echo -e "${GREEN}✅ Security testing completed!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Review all generated reports for vulnerabilities${NC}"
echo -e "${YELLOW}   and take appropriate action to fix any security issues found.${NC}"
echo ""
