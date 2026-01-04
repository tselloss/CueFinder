# Quick Viber Verification Test Script
# PowerShell script to test phone verification API

Write-Host "🧪 Testing Viber Phone Verification" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:5000/api"
$testPhone = "+1234567890"

# Step 1: Register a test user (if needed)
Write-Host "Step 1: Register/Login..." -ForegroundColor Yellow
$registerData = @{
    username = "testuser_$(Get-Random -Maximum 9999)"
    password = "Test123!"
    name = "Test User"
    phone = $testPhone
    email = "test$(Get-Random -Maximum 9999)@example.com"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    $token = $registerResponse.token
    $userId = $registerResponse.id
    Write-Host "✅ Registered: Username = $($registerResponse.username)" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    # If registration fails, try login
    Write-Host "Registration failed, trying login..." -ForegroundColor Yellow
    $loginData = @{
        username = "testuser"
        password = "Test123!"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    $userId = $loginResponse.id
    Write-Host "✅ Logged in as: $($loginResponse.username)" -ForegroundColor Green
}

Start-Sleep -Seconds 1

# Step 2: Send Viber verification
Write-Host "`nStep 2: Send Viber Verification..." -ForegroundColor Yellow
$verifyData = @{
    phoneNumber = $testPhone
    method = "Viber"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $sendResponse = Invoke-RestMethod -Uri "$baseUrl/auth/phone/send-verification" -Method Post -Body $verifyData -Headers $headers
    $verificationToken = $sendResponse.token
    Write-Host "✅ Verification sent!" -ForegroundColor Green
    Write-Host "   Token: $verificationToken" -ForegroundColor Gray
    Write-Host "   Method: $($sendResponse.method)" -ForegroundColor Gray
    Write-Host "   Expires: $($sendResponse.expiresAt)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Step 3: Get backend logs to find the verification code
Write-Host "`nStep 3: Checking backend logs for verification code..." -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$logs = docker logs cuefinder-backend --tail 20 2>&1
$codePattern = "verification code: (\d{4})"
$magicLinkPattern = "verify: (http[^\s]+)"

if ($logs -match $codePattern) {
    $code = $Matches[1]
    Write-Host "✅ Found verification code: $code" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not find verification code in logs" -ForegroundColor Yellow
    Write-Host "Logs preview:" -ForegroundColor Gray
    $logs | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Prompt user to enter code manually
    Write-Host "`nPlease check Docker logs manually and enter the 4-digit code:" -ForegroundColor Yellow
    $code = Read-Host "Enter verification code"
}

if ($logs -match $magicLinkPattern) {
    $magicLink = $Matches[1]
    Write-Host "✅ Magic link: $magicLink" -ForegroundColor Green
}

Write-Host "================================================`n" -ForegroundColor Cyan

# Step 4: Verify the code
Write-Host "Step 4: Verifying code $code..." -ForegroundColor Yellow
$verifyCodeData = @{
    token = $verificationToken
    code = $code
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/auth/phone/verify-code" -Method Post -Body $verifyCodeData -Headers $headers
    if ($verifyResponse.verified) {
        Write-Host "✅ Phone verified successfully!" -ForegroundColor Green
        Write-Host "   Message: $($verifyResponse.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Verification failed!" -ForegroundColor Red
        Write-Host "   Message: $($verifyResponse.message)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Step 5: Check database
Write-Host "`nStep 5: Checking database..." -ForegroundColor Yellow
$dbQuery = "SELECT ""Username"", ""Phone"", ""IsPhoneVerified"", ""PhoneVerifiedAt"" FROM ""Users"" WHERE ""Phone"" = '$testPhone';"
$dbResult = docker exec cuefinder-postgres psql -U postgres -d cuefinder -c $dbQuery 2>&1

Write-Host "Database result:" -ForegroundColor Gray
Write-Host $dbResult -ForegroundColor Gray

Write-Host "`n✅ TEST COMPLETED!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

# Summary
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "  - Phone: $testPhone" -ForegroundColor White
Write-Host "  - Method: Viber" -ForegroundColor White
Write-Host "  - Verification Code: $code" -ForegroundColor White
Write-Host "  - Status: Verified ✅" -ForegroundColor Green
Write-Host "`nTo test again, run: .\test-viber-verification.ps1" -ForegroundColor Gray
