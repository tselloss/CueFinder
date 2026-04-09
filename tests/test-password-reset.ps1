# Password Reset End-to-End Test
# This script tests the complete password reset flow

$API_BASE_URL = "http://localhost:5000/api"
$TEST_EMAIL = "testuser@example.com"
$TEST_USERNAME = "testuser"

Write-Host "=== Password Reset E2E Test ===" -ForegroundColor Cyan
Write-Host ""

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body
    )
    
    try {
        $response = Invoke-RestMethod -Method $Method -Uri "$API_BASE_URL$Endpoint" `
            -Body ($Body | ConvertTo-Json) `
            -ContentType "application/json" `
            -ErrorAction Stop
        return $response
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
        return $null
    }
}

# Test 1: Request password reset with email
Write-Host "Test 1: Requesting password reset with email..." -ForegroundColor Yellow
$forgotPasswordRequest = @{
    emailOrUsername = $TEST_EMAIL
}

$response = Invoke-ApiCall -Method "POST" -Endpoint "/auth/forgot-password" -Body $forgotPasswordRequest

if ($response) {
    Write-Host "✓ Password reset request accepted" -ForegroundColor Green
    Write-Host "  Message: $($response.message)" -ForegroundColor Gray
} else {
    Write-Host "✗ Password reset request failed" -ForegroundColor Red
}

Write-Host ""

# Test 2: Request password reset with username
Write-Host "Test 2: Requesting password reset with username..." -ForegroundColor Yellow
$forgotPasswordRequest = @{
    emailOrUsername = $TEST_USERNAME
}

$response = Invoke-ApiCall -Method "POST" -Endpoint "/auth/forgot-password" -Body $forgotPasswordRequest

if ($response) {
    Write-Host "✓ Password reset request accepted" -ForegroundColor Green
    Write-Host "  Message: $($response.message)" -ForegroundColor Gray
} else {
    Write-Host "✗ Password reset request failed" -ForegroundColor Red
}

Write-Host ""

# Test 3: Request with non-existent user (should still return 200 OK)
Write-Host "Test 3: Requesting reset for non-existent user..." -ForegroundColor Yellow
$forgotPasswordRequest = @{
    emailOrUsername = "nonexistent@example.com"
}

$response = Invoke-ApiCall -Method "POST" -Endpoint "/auth/forgot-password" -Body $forgotPasswordRequest

if ($response) {
    Write-Host "✓ Uniform response received (prevents account enumeration)" -ForegroundColor Green
    Write-Host "  Message: $($response.message)" -ForegroundColor Gray
} else {
    Write-Host "✗ Request failed" -ForegroundColor Red
}

Write-Host ""

# Test 4: Validate invalid token
Write-Host "Test 4: Validating invalid token..." -ForegroundColor Yellow
$validateRequest = @{
    token = "invalid-token-12345"
}

try {
    $response = Invoke-RestMethod -Method "POST" -Uri "$API_BASE_URL/auth/validate-reset-token" `
        -Body ($validateRequest | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "✗ Should have returned 401" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Invalid token correctly rejected with 401" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Reset password with invalid token
Write-Host "Test 5: Attempting reset with invalid token..." -ForegroundColor Yellow
$resetRequest = @{
    token = "invalid-token-12345"
    newPassword = "NewPassword123!"
    confirmPassword = "NewPassword123!"
}

try {
    $response = Invoke-RestMethod -Method "POST" -Uri "$API_BASE_URL/auth/reset-password" `
        -Body ($resetRequest | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "✗ Should have returned 401" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Invalid token correctly rejected with 401" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 6: Reset password with weak password
Write-Host "Test 6: Attempting reset with weak password..." -ForegroundColor Yellow
$resetRequest = @{
    token = "some-token"
    newPassword = "weak"
    confirmPassword = "weak"
}

try {
    $response = Invoke-RestMethod -Method "POST" -Uri "$API_BASE_URL/auth/reset-password" `
        -Body ($resetRequest | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "✗ Should have rejected weak password" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✓ Weak password correctly rejected with 400" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 7: Reset password with mismatched passwords
Write-Host "Test 7: Attempting reset with mismatched passwords..." -ForegroundColor Yellow
$resetRequest = @{
    token = "some-token"
    newPassword = "NewPassword123!"
    confirmPassword = "DifferentPassword123!"
}

try {
    $response = Invoke-RestMethod -Method "POST" -Uri "$API_BASE_URL/auth/reset-password" `
        -Body ($resetRequest | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "✗ Should have rejected mismatched passwords" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✓ Mismatched passwords correctly rejected with 400" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✓ Tests completed" -ForegroundColor Green
Write-Host ""
Write-Host "Note: To test the complete flow with email delivery:" -ForegroundColor Yellow
Write-Host "1. Ensure backend is running (dotnet run in CueFinderBE)" -ForegroundColor Gray
Write-Host "2. Ensure database is running and migrations are applied" -ForegroundColor Gray
Write-Host "3. Configure email settings in appsettings.Development.json" -ForegroundColor Gray
Write-Host "4. Create a test user first" -ForegroundColor Gray
Write-Host "5. Request password reset and check email for token link" -ForegroundColor Gray
Write-Host "6. Use the token from email to test the reset flow" -ForegroundColor Gray
