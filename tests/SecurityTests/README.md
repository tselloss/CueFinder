# CueFinder Security & Penetration Testing Suite

## Overview
This comprehensive security testing suite includes automated penetration tests, OWASP ZAP integration, and security scans for the CueFinder application.

## Test Categories

### 1. API Security Tests (`api-security-tests.js`)
- **SQL Injection**: Tests for SQL injection vulnerabilities in login, search, and filter endpoints
- **Authentication Bypass**: Attempts to access protected endpoints without valid credentials
- **Input Validation**: Tests for XSS, buffer overflow, and malicious input handling
- **Rate Limiting**: Verifies rate limiting on sensitive endpoints
- **IDOR (Insecure Direct Object References)**: Tests for unauthorized access to resources

### 2. File Upload Security Tests (`file-upload-security-tests.js`)
- **Malicious File Extensions**: PHP shells, executables, JavaScript files
- **MIME Type Bypass**: Uploading malicious files with fake content types
- **SVG XSS**: SVG files with embedded JavaScript
- **Polyglot Files**: Files that are valid images but contain malicious code
- **Path Traversal**: Attempts to write files outside upload directory
- **File Size Limits**: Tests for DoS via large file uploads
- **Concurrent Uploads**: Rate limiting tests

### 3. Authentication & Authorization Tests (`auth-penetration-tests.js`)
- **JWT Token Manipulation**: Algorithm confusion, weak secrets, token tampering
- **Privilege Escalation**: Attempts to access admin/moderator endpoints
- **Session Management**: Token reuse, concurrent sessions, session fixation
- **Password Security**: Weak password acceptance, password reset vulnerabilities
- **Brute Force Protection**: Account lockout testing
- **CORS & CSRF**: Cross-origin and cross-site request forgery tests

### 4. OWASP ZAP Integration (`zap-integration.js`)
- **Spider Scan**: Automated crawling of application
- **AJAX Spider**: JavaScript-rendered content discovery
- **Passive Scan**: Non-intrusive security checks
- **Active Scan**: Comprehensive vulnerability scanning
- **Authenticated Scanning**: Tests while logged in
- **HTML Reports**: Professional vulnerability reports

## Installation

```bash
cd tests/SecurityTests
npm install
```

## Prerequisites

### For Basic Tests
- Node.js installed
- CueFinder application running (default: http://localhost:5000)

### For OWASP ZAP Tests
1. Download OWASP ZAP: https://www.zaproxy.org/download/
2. Start ZAP in daemon mode:
   ```bash
   # Windows
   zap.bat -daemon -port 8080 -config api.key=changeme
   
   # Linux/Mac
   zap.sh -daemon -port 8080 -config api.key=changeme
   ```

## Running Tests

### Windows (PowerShell)

```powershell
# Run all tests
.\run-security-tests.ps1 -All

# Run specific test categories
.\run-security-tests.ps1 -API
.\run-security-tests.ps1 -FileUpload
.\run-security-tests.ps1 -Auth
.\run-security-tests.ps1 -ZAP

# Run multiple categories
.\run-security-tests.ps1 -API -Auth

# Specify custom API URL
.\run-security-tests.ps1 -All -ApiUrl "http://your-server.com"

# Verbose output
.\run-security-tests.ps1 -All -Verbose
```

### Linux/Mac (Bash)

```bash
# Make script executable
chmod +x run-security-tests.sh

# Run all tests
./run-security-tests.sh --all

# Run specific test categories
./run-security-tests.sh --api
./run-security-tests.sh --file
./run-security-tests.sh --auth
./run-security-tests.sh --zap

# Run multiple categories
./run-security-tests.sh --api --auth

# Specify custom API URL
./run-security-tests.sh --all --url "http://your-server.com"

# Verbose output
./run-security-tests.sh --all --verbose
```

### Individual Tests

```bash
# Set API URL
export API_URL=http://localhost:5000

# Run individual test files
node api-security-tests.js
node file-upload-security-tests.js
node auth-penetration-tests.js
node zap-integration.js
```

## Configuration

### Environment Variables
- `API_URL`: Target application URL (default: http://localhost:5000)
- `TEST_USERNAME`: Username for authenticated scans
- `TEST_PASSWORD`: Password for authenticated scans

### ZAP Configuration
Edit `zap-integration.js` to customize:
```javascript
const scanner = new ZAPSecurityScanner(
    'your-api-key',  // ZAP API key
    'http://localhost:8080'  // ZAP proxy URL
);
```

## Reports

All tests generate detailed JSON reports:
- `security-report-*.json` - API security test results
- `file-upload-security-report-*.json` - File upload test results
- `auth-security-report-*.json` - Authentication test results
- `zap-scan-results-*.json` - ZAP scan results (JSON)
- `zap-security-report-*.html` - ZAP scan results (HTML)

### Report Structure

```json
{
  "timestamp": "2026-01-22T...",
  "target": "http://localhost:5000",
  "vulnerabilities": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "endpoint": "/api/endpoint",
      "description": "Vulnerability description",
      "details": { ... }
    }
  ],
  "summary": {
    "total": 5,
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1
  }
}
```

## Security Best Practices

### Before Running Tests
1. ✅ Get authorization to test (especially on production)
2. ✅ Run tests in isolated environment first
3. ✅ Backup database before testing
4. ✅ Inform team members about testing activities
5. ✅ Monitor logs during testing

### After Running Tests
1. 📊 Review all generated reports
2. 🔴 Prioritize CRITICAL and HIGH severity issues
3. 🛠️ Create tickets for each vulnerability
4. ✅ Fix vulnerabilities and re-test
5. 📝 Document security improvements

## Common Vulnerabilities to Fix

### Critical Priority
- SQL Injection
- Authentication Bypass
- Remote Code Execution via file uploads
- Privilege Escalation

### High Priority
- XSS (Cross-Site Scripting)
- IDOR (Insecure Direct Object References)
- Weak JWT Implementation
- Session Management Issues

### Medium Priority
- Missing Rate Limiting
- CORS Misconfiguration
- Weak Password Policy
- Information Disclosure

## Continuous Security Testing

### CI/CD Integration

Add to your GitHub Actions or CI pipeline:

```yaml
name: Security Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd tests/SecurityTests
          npm install
      
      - name: Run Security Tests
        run: |
          cd tests/SecurityTests
          ./run-security-tests.sh --api --auth --file
        env:
          API_URL: http://localhost:5000
      
      - name: Upload Reports
        uses: actions/upload-artifact@v2
        with:
          name: security-reports
          path: tests/SecurityTests/*-report-*.json
```

## Troubleshooting

### "Cannot reach application"
- Ensure your application is running
- Check the API URL is correct
- Verify firewall/network settings

### "ZAP connection failed"
- Ensure OWASP ZAP is installed and running
- Check ZAP is running on correct port (default: 8080)
- Verify API key matches configuration

### Tests timing out
- Increase timeout in test files
- Check application performance
- Run tests with fewer concurrent requests

### False positives
- Review each vulnerability carefully
- Some alerts may not apply to your setup
- Document accepted risks

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Database](https://cwe.mitre.org/)

## Support

For issues or questions about security testing:
1. Review test logs and error messages
2. Check application logs for details
3. Consult OWASP documentation
4. Create an issue in the project repository

## Legal Notice

⚠️ **Important**: Only run these tests on systems you own or have explicit permission to test. Unauthorized security testing may be illegal in your jurisdiction.

These tests are provided for educational and authorized security testing purposes only. Always:
- Get written permission before testing
- Follow responsible disclosure practices
- Respect rate limits and system resources
- Document all findings professionally
