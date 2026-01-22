# Security Testing in Deployment Pipeline

## Overview

Security testing is now integrated into the CueFinder deployment pipeline to ensure no critical vulnerabilities are deployed to production.

## Automated Security Testing

### GitHub Actions Workflow

Security tests run automatically on:
- **Every push** to `main`, `develop`, or `release` branches
- **Every pull request** to these branches
- **Scheduled**: Every Monday at 2 AM UTC
- **Manual trigger**: Via workflow_dispatch

**Workflow File:** [.github/workflows/security-tests.yml](.github/workflows/security-tests.yml)

### Deployment Integration

Security tests are integrated into the production deployment workflow:

**Workflow File:** [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml)

**Steps:**
1. Deploy application to production
2. Wait for application to start
3. Run security tests against production URL
4. Check for critical vulnerabilities
5. **Rollback deployment** if critical issues found
6. Verify deployment health

## Pre-Deployment Security Check

### Before Manual Deployment

Always run security checks before deploying:

**Windows (PowerShell):**
```powershell
.\deployment\pre-deploy-security-check.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x deployment/pre-deploy-security-check.sh
./deployment/pre-deploy-security-check.sh
```

### What It Checks

✅ Docker is running  
✅ Application starts successfully  
✅ Health endpoint responds  
✅ SQL injection protection  
✅ Authentication bypass attempts  
✅ XSS vulnerabilities  
✅ Rate limiting configuration  
✅ IDOR vulnerabilities  

### Security Thresholds

**🔴 CRITICAL - Deployment BLOCKED:**
- Deployment will not proceed
- Must be fixed before deploying
- Examples: SQL injection, authentication bypass

**🟠 HIGH - Warning with Confirmation:**
- Warns but allows deployment
- Requires manual confirmation
- Should be fixed ASAP

**🟡 MEDIUM/LOW - Informational:**
- Deployment proceeds
- Should be reviewed and addressed

## Manual Security Testing

### Run Full Security Suite

```powershell
cd tests\SecurityTests
.\run-security-tests.ps1 -All
```

### Run Specific Tests

```powershell
# API Security only
.\run-security-tests.ps1 -API

# Authentication tests
.\run-security-tests.ps1 -Auth

# File upload security
.\run-security-tests.ps1 -FileUpload
```

### Test Production Environment

```powershell
.\run-security-tests.ps1 -All -ApiUrl "https://your-domain.com"
```

## Security Reports

### Artifact Storage

Security reports are automatically uploaded to GitHub Actions:
- **Retention**: 30 days
- **Location**: Actions → Security Tests → Artifacts
- **Format**: JSON

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
      "details": {}
    }
  ],
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}
```

## Pull Request Integration

Security test results are automatically commented on pull requests:

**Comment includes:**
- Summary of vulnerabilities
- Severity breakdown
- List of issues found
- Full JSON report (expandable)

## Deployment Workflow

### Recommended Process

1. **Develop & Test Locally**
   ```powershell
   docker compose up -d
   .\tests\SecurityTests\run-security-tests.ps1 -All
   ```

2. **Commit & Push**
   - Security tests run automatically
   - Review results in GitHub Actions

3. **Create Pull Request**
   - Security results commented on PR
   - Review before merging

4. **Pre-Deployment Check**
   ```powershell
   .\deployment\pre-deploy-security-check.ps1
   ```

5. **Deploy to Production**
   - Automated deployment runs security tests
   - Rollback if critical issues found
   - Verify deployment successful

## CI/CD Integration

### Build Pipeline

```yaml
jobs:
  test:
    - Unit Tests
    - Integration Tests
    
  security:  # ← NEW
    - Security Tests
    - Vulnerability Scan
    
  deploy:
    needs: [test, security]  # Only deploy if security passes
    - Deploy to staging
    - Run security tests on staging
    - Deploy to production
    - Run security tests on production
    - Rollback if critical issues
```

## Monitoring & Alerts

### Failed Security Tests

When security tests fail:
1. **GitHub Actions notification** sent to team
2. **Build status** marked as failed
3. **Deployment blocked** (if critical)
4. **Detailed report** available in artifacts

### Regular Scans

Weekly scheduled scans:
- Run every Monday at 2 AM UTC
- Test production environment
- Email alerts if new vulnerabilities found

## Security Test Coverage

### Current Tests

✅ **API Security**
- SQL Injection (12+ patterns)
- XSS (6+ vectors)
- Authentication bypass
- Authorization checks
- Rate limiting
- IDOR vulnerabilities

✅ **Authentication**
- JWT manipulation
- Token expiration
- Session management
- Password policies
- Brute force protection

✅ **File Uploads**
- Malicious file types
- MIME type bypass
- Path traversal
- Polyglot files
- Size limits

### Future Enhancements

🔄 **Planned:**
- OWASP ZAP integration
- Dependency vulnerability scanning
- Container security scanning
- SSL/TLS configuration tests
- CORS/CSP header validation

## Troubleshooting

### Security Tests Failing Locally

```powershell
# Ensure application is running
docker compose up -d

# Wait for health
Start-Sleep -Seconds 15

# Check application is accessible
curl http://localhost:5000/health

# Run tests with verbose output
.\run-security-tests.ps1 -All -Verbose
```

### False Positives

If a test produces false positives:
1. Review the test logic
2. Update test to be more specific
3. Document the exception
4. Never disable security tests

### Deployment Blocked

If deployment is blocked by security tests:
1. **Review security report** in artifacts
2. **Fix critical vulnerabilities**
3. **Re-run security tests** locally
4. **Commit fixes** and push
5. **Wait for CI/CD** to pass
6. **Deploy again**

## Best Practices

### Development

✅ Run security tests before committing  
✅ Fix issues immediately  
✅ Never commit with known vulnerabilities  
✅ Review security reports regularly  

### Deployment

✅ Always run pre-deployment check  
✅ Test in staging first  
✅ Monitor production after deployment  
✅ Have rollback plan ready  

### Security Maintenance

✅ Review weekly scan results  
✅ Update security test patterns  
✅ Keep dependencies updated  
✅ Document security decisions  

## Support

For questions about security testing:
- Review [Security Test Results](../tests/SecurityTests/SECURITY_TEST_RESULTS.md)
- Check [Security Tests README](../tests/SecurityTests/README.md)
- Review failed test artifacts in GitHub Actions

## Emergency Response

If critical vulnerability found in production:

1. **Immediate**: Run security tests
   ```powershell
   .\run-security-tests.ps1 -All -ApiUrl "https://production-url.com"
   ```

2. **Assess**: Review severity and impact

3. **Fix**: Apply hot fix if needed

4. **Deploy**: Emergency deployment with security validation

5. **Verify**: Confirm vulnerability resolved

6. **Document**: Post-mortem analysis

---

**Remember:** Security is not optional. All deployments must pass security validation.
