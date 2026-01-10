# Test Terms Acceptance in Registration
# This script tests that terms acceptance is properly validated and stored

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing Terms Acceptance Flow" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:5000/api"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Test 1: Registration without accepting terms (should fail)
Write-Host "📋 Test 1: Registration WITHOUT accepting terms" -ForegroundColor Yellow
Write-Host "   Expected: 400 Bad Request" -ForegroundColor Gray

$testUser1 = @{
    username = "testuser_noterms_$timestamp"
    password = "Test123!"
    name = "Test User No Terms"
    email = "noterms_$timestamp@test.com"
    phone = "+306912345678"
    acceptedTerms = $false
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "$apiUrl/auth/register" `
        -Method POST `
        -Body $testUser1 `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "❌ TEST FAILED: Request should have been rejected!" -ForegroundColor Red
    Write-Host "   Status: $($response1.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "✅ TEST PASSED: Request correctly rejected (400 Bad Request)" -ForegroundColor Green
        
        # Try to read error message
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "   Error message: $errorBody" -ForegroundColor Gray
    } else {
        Write-Host "❌ TEST FAILED: Wrong status code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Registration with accepted terms (should succeed)
Write-Host "📋 Test 2: Registration WITH accepted terms" -ForegroundColor Yellow
Write-Host "   Expected: 200 OK + user created" -ForegroundColor Gray

$testUser2 = @{
    username = "testuser_terms_$timestamp"
    password = "Test123!"
    name = "Test User With Terms"
    email = "terms_$timestamp@test.com"
    phone = "+306987654321"
    acceptedTerms = $true
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$apiUrl/auth/register" `
        -Method POST `
        -Body $testUser2 `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ TEST PASSED: User registered successfully" -ForegroundColor Green
    Write-Host "   Username: $($response2.username)" -ForegroundColor Gray
    Write-Host "   User ID: $($response2.userId)" -ForegroundColor Gray
    
    # Test 3: Verify database has correct values
    Write-Host ""
    Write-Host "📋 Test 3: Verifying database values" -ForegroundColor Yellow
    
    $dbQuery = "SELECT Username, AcceptedTerms, AcceptedTermsAt FROM `"Users`" WHERE Username = 'testuser_terms_$timestamp';"
    $dbResult = docker exec -i cuefinder-postgres psql -U postgres -d cuefinder -t -A -F "," -c "$dbQuery"
    
    if ($dbResult) {
        $fields = $dbResult.Split(',')
        $username = $fields[0]
        $acceptedTerms = $fields[1]
        $acceptedTermsAt = $fields[2]
        
        Write-Host "   Database values:" -ForegroundColor Gray
        Write-Host "      Username: $username" -ForegroundColor Gray
        Write-Host "      AcceptedTerms: $acceptedTerms" -ForegroundColor Gray
        Write-Host "      AcceptedTermsAt: $acceptedTermsAt" -ForegroundColor Gray
        
        if ($acceptedTerms -eq "t") {
            Write-Host "   ✅ AcceptedTerms is TRUE" -ForegroundColor Green
        } else {
            Write-Host "   ❌ AcceptedTerms is FALSE (should be TRUE)" -ForegroundColor Red
        }
        
        if ($acceptedTermsAt -and $acceptedTermsAt -ne "") {
            Write-Host "   ✅ AcceptedTermsAt timestamp is set" -ForegroundColor Green
        } else {
            Write-Host "   ❌ AcceptedTermsAt is NULL (should have timestamp)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ User not found in database!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ TEST FAILED: Registration should have succeeded!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Tests Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
