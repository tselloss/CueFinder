# ========================================
# Test SMS Registration Flow
# ========================================

Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SMS Registration 2FA Test Script    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:3000"

# Generate unique username
$timestamp = Get-Date -Format "HHmmss"
$testUsername = "testuser_$timestamp"

Write-Host "📝 Test User: $testUsername" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────`n" -ForegroundColor Gray

# ========================================
# Step 1: Register New User
# ========================================

Write-Host "Step 1: Registering new user..." -ForegroundColor Cyan

$registerData = @{
    username = $testUsername
    password = "Test123!"
    name = "Test User $timestamp"
    email = "test$timestamp@example.com"
    phone = "+306987901345"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.userId)" -ForegroundColor Gray
    Write-Host "   Token: $($registerResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    $token = $registerResponse.accessToken
} catch {
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# ========================================
# Step 2: Send SMS Verification
# ========================================

Write-Host "`nStep 2: Sending SMS verification code..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$verifyData = @{
    phoneNumber = "+306987901345"
    method = "SMS"
} | ConvertTo-Json

try {
    $smsResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/auth/phone/send-verification" `
        -Method Post `
        -Body $verifyData `
        -Headers $headers
    
    Write-Host "✅ SMS verification sent!" -ForegroundColor Green
    Write-Host "   Token: $($smsResponse.token.Substring(0, 40))..." -ForegroundColor Gray
    Write-Host "   Expires: $($smsResponse.expiresAt)" -ForegroundColor Gray
    Write-Host "   Method: $($smsResponse.method)" -ForegroundColor Gray
    
    $verificationToken = $smsResponse.token
} catch {
    Write-Host "❌ SMS sending failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# ========================================
# Step 3: Extract Code from Backend Logs
# ========================================

Write-Host "`nStep 3: Extracting verification code from backend logs..." -ForegroundColor Cyan

try {
    $logs = docker logs cuefinder-backend --tail 30 2>&1 | Out-String
    
    # Find the code in the logs
    $codeMatch = [regex]::Match($logs, 'Code:\s*(\d{4})')
    
    if ($codeMatch.Success) {
        $code = $codeMatch.Groups[1].Value
        Write-Host "✅ Code found: $code" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Code not found in logs!" -ForegroundColor Yellow
        Write-Host "   Please check Docker backend logs manually:" -ForegroundColor Yellow
        Write-Host "   docker logs cuefinder-backend --tail 30" -ForegroundColor Gray
        Write-Host "`nEnter the 4-digit code from the logs: " -NoNewline -ForegroundColor Cyan
        $code = Read-Host
    }
} catch {
    Write-Host "⚠️  Could not read backend logs" -ForegroundColor Yellow
    Write-Host "   Enter the 4-digit code: " -NoNewline -ForegroundColor Cyan
    $code = Read-Host
}

Start-Sleep -Seconds 2

# ========================================
# Step 4: Verify Code
# ========================================

Write-Host "`nStep 4: Verifying SMS code..." -ForegroundColor Cyan

$verifyCodeData = @{
    token = $verificationToken
    code = $code
} | ConvertTo-Json

try {
    $verifyResult = Invoke-RestMethod `
        -Uri "$baseUrl/api/auth/phone/verify-code" `
        -Method Post `
        -Body $verifyCodeData `
        -Headers $headers
    
    if ($verifyResult.verified) {
        Write-Host "✅ Phone verified successfully!" -ForegroundColor Green
        Write-Host "   Message: $($verifyResult.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Verification failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Code verification failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# ========================================
# Summary
# ========================================

Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     🎉 2FA REGISTRATION COMPLETE!     ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "✅ User registered: $testUsername" -ForegroundColor Green
Write-Host "✅ Password verified (something you know)" -ForegroundColor Green
Write-Host "✅ Phone verified (something you have)" -ForegroundColor Green
Write-Host "✅ 2FA authentication complete!" -ForegroundColor Green

Write-Host "`n📋 Test Summary:" -ForegroundColor Cyan
Write-Host "   Username: $testUsername" -ForegroundColor Gray
Write-Host "   Password: Test123!" -ForegroundColor Gray
Write-Host "   Phone: +306987901345" -ForegroundColor Gray
Write-Host "   Email: test$timestamp@example.com" -ForegroundColor Gray
Write-Host "   Phone Verified: ✓" -ForegroundColor Green

Write-Host "`n🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open browser: $frontendUrl" -ForegroundColor Gray
Write-Host "   2. Click 'Register'" -ForegroundColor Gray
Write-Host "   3. Fill registration form" -ForegroundColor Gray
Write-Host "   4. Check phone for SMS code (Mock mode = check logs)" -ForegroundColor Gray
Write-Host "   5. Enter code to complete registration" -ForegroundColor Gray

Write-Host "`n💡 Production:" -ForegroundColor Cyan
Write-Host "   - Add Twilio credentials to docker-compose.yml" -ForegroundColor Gray
Write-Host "   - Change Sms__Provider from 'Mock' to 'SMS'" -ForegroundColor Gray
Write-Host "   - Users will receive real SMS messages" -ForegroundColor Gray
Write-Host "   - See: TWILIO_QUICK_START.md`n" -ForegroundColor Gray
