# Running Security Tests on Production Server

## ⚠️ Important Notes

1. **Rate Limiting**: Your production server has rate limiting (5 requests/60 seconds) which will slow down security tests
2. **Test Duration**: With rate limiting enabled, tests take ~3-5 minutes (includes 60-second waits)
3. **Network Timeout**: All tests now have 10-second timeouts to prevent hanging

## 🚀 Quick Start

### Option 1: Run with Rate Limiting (Recommended)
```bash
cd tests/SecurityTests
node api-security-tests.js
```

**Expected behavior:**
- Tests will automatically detect HTTP 429 responses
- Will wait 60 seconds when rate limit hit
- Total duration: ~3-5 minutes

### Option 2: Temporarily Disable Rate Limiting (Faster Testing)
```powershell
# 1. Disable rate limiting
.\deployment\toggle-rate-limiting.ps1

# 2. Rebuild backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend

# 3. Restart backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# 4. Wait for backend to start
Start-Sleep -Seconds 15

# 5. Run tests (will be MUCH faster)
cd tests\SecurityTests
node api-security-tests.js

# 6. IMPORTANT: Re-enable rate limiting
cd ..\..
.\deployment\toggle-rate-limiting.ps1 -Enable

# 7. Rebuild and restart again
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

**Test duration without rate limiting:** ~30-60 seconds

## 📊 Test Progress Output

The tests now show detailed progress:

```
🔒 Starting API Security Penetration Tests
Target: http://localhost:5000

[2026-01-22T12:18:00.913Z] [TEST] Starting SQL Injection Tests
[2026-01-22T12:18:00.913Z] [DEBUG] Testing payload 1/12: ' OR '1'='1...
[2026-01-22T12:18:01.648Z] [DEBUG] Testing payload 2/12: ' OR '1'='1' --...
...
[2026-01-22T12:18:03.913Z] [WARN] ⚠️  Rate limiting detected - waiting 60 seconds...
[2026-01-22T12:19:03.918Z] [DEBUG] Testing payload 7/12: 1' AND 1=2--...
...
```

## 🔍 What Gets Tested

### 1. SQL Injection Tests (~2 minutes)
- 12 SQL injection payloads on login endpoint
- 36 SQL injection tests on search endpoints (3 endpoints × 12 payloads)
- Checks for SQL errors in responses

### 2. Authentication Bypass Tests (<1 second)
- Tests with no token, invalid token, expired token
- Authorization header manipulation

### 3. Input Validation Tests (<1 second)
- XSS payloads in registration
- Script injection attempts

### 4. Rate Limiting Tests (<1 second)
- Verifies rate limiting is enforced
- Tests rapid-fire requests

### 5. IDOR Tests (<1 second)
- Tests unauthorized access to other users' data

## 🐛 Troubleshooting

### Test Hangs at "Starting SQL Injection Tests"

**Old behavior (FIXED):**
- No timeout → test hangs forever if server doesn't respond

**New behavior:**
- 10-second timeout per request
- Shows error message if timeout occurs
- Continues to next test

### Connection Refused Errors
```
[ERROR] Cannot connect to server - is it running?
```

**Solutions:**
1. Check backend is running:
   ```bash
   docker compose ps backend
   ```

2. Check backend logs:
   ```bash
   docker compose logs backend
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:5000/health
   ```

### Rate Limiting Slowing Tests

**Solution 1: Wait it out (safest)**
- Tests automatically wait 60 seconds when rate limit hit
- Total test time: 3-5 minutes
- No configuration changes needed

**Solution 2: Temporarily disable (faster)**
- Use `toggle-rate-limiting.ps1` script
- Test duration: 30-60 seconds
- **MUST re-enable after testing!**

### Timeout Errors
```
[WARN] ⚠️  Request timeout for payload: ' OR '1'='1
```

**This is normal if:**
- Server is under heavy load
- Network latency is high
- Backend is processing intensive requests

**If it happens frequently:**
1. Check backend performance
2. Check server resources (CPU, memory)
3. Increase timeout in test script (currently 10 seconds)

## 📈 Performance Metrics

### With Rate Limiting
- SQL Injection Tests: ~2 minutes (includes 2 × 60-second waits)
- Other Tests: <5 seconds
- **Total: ~3 minutes**

### Without Rate Limiting
- SQL Injection Tests: ~20 seconds
- Other Tests: <5 seconds
- **Total: ~30 seconds**

## 🔒 Security Considerations

### When to Disable Rate Limiting

**Safe scenarios:**
- ✅ Local development/testing
- ✅ Dedicated security testing on staging server
- ✅ Before production deployment (pre-deployment validation)

**Unsafe scenarios:**
- ❌ Production server while users are active
- ❌ For extended periods (>1 hour)
- ❌ Without monitoring

### Re-enabling Rate Limiting

**CRITICAL:** Always re-enable rate limiting after testing:

```powershell
.\deployment\toggle-rate-limiting.ps1 -Enable
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

**Verify it's enabled:**
```bash
# Try to login 6 times rapidly - 6th should return HTTP 429
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 🎯 CI/CD Integration

Security tests run automatically in GitHub Actions:
- ✅ Every push to main/develop/release
- ✅ Every pull request
- ✅ Every Monday at 2 AM (scheduled)
- ✅ After production deployment

**Rate limiting in CI/CD:**
- Tests run with rate limiting enabled (production-like)
- Longer test duration accepted for accuracy
- No manual intervention needed

## 📝 Test Reports

After each test run, a JSON report is generated:

```json
{
  "timestamp": "2026-01-22T12:20:18.973Z",
  "target": "http://localhost:5000",
  "vulnerabilities": [],
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}
```

**Location:** `tests/SecurityTests/security-report-<timestamp>.json`

## 🆘 Quick Commands

### Check if server is responding
```bash
curl http://localhost:5000/health
```

### Check rate limiting status
```bash
# Look for UseRateLimiting in Program.cs
grep "UseRateLimiting" CueFinderBE/Program.cs
```

### View backend logs during tests
```bash
docker compose logs -f backend
```

### Kill stuck tests
```bash
# Press Ctrl+C
# Or find and kill Node.js process
Get-Process node | Stop-Process
```

## ✅ Success Indicators

Test completed successfully when you see:

```
================================================================================
API SECURITY PENETRATION TEST REPORT
================================================================================
Report Generated: 2026-01-22T12:20:18.973Z
Target: http://localhost:5000
================================================================================

✅ No vulnerabilities detected!
================================================================================

Detailed report saved to: security-report-1769084418974.json
```

---

**Questions?** See [PRODUCTION_TESTING_GUIDE.md](PRODUCTION_TESTING_GUIDE.md) or [SECURITY_IN_DEPLOYMENT.md](SECURITY_IN_DEPLOYMENT.md)
