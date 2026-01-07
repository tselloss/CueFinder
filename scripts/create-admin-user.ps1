# Script to create admin user via API
# This should be run after the backend is up and running

param(
    [string]$BackendUrl = "http://localhost:5000"
)

Write-Host "Creating admin user via API..." -ForegroundColor Cyan

$adminUser = @{
    username = "cuefinderAdmin"
    password = "TheBestAdminThatYouEverHave"
    name = "Admin User"
    email = "admin@cuefinder.com"
    phone = "+1234567890"
    role = "admin"
} | ConvertTo-Json

try {
    # Check if user already exists by trying to login first
    $loginData = @{
        username = "cuefinderAdmin"
        password = "TheBestAdminThatYouEverHave"
    } | ConvertTo-Json

    try {
        $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method Post -Body $loginData -ContentType "application/json" -ErrorAction SilentlyContinue
        Write-Host "✓ Admin user already exists and can login" -ForegroundColor Green
        return
    } catch {
        # User doesn't exist, continue with registration
        Write-Host "Admin user doesn't exist, creating..." -ForegroundColor Yellow
    }

    # Register the admin user
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/auth/register" -Method Post -Body $adminUser -ContentType "application/json"
    
    Write-Host "Response received: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
    if ($response.token) {
        Write-Host "✓ Admin user created successfully!" -ForegroundColor Green
        Write-Host "  Username: cuefinderAdmin" -ForegroundColor Gray
        Write-Host "  Password: TheBestAdminThatYouEverHave" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to create admin user - no token received" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "✓ Admin user already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Error creating admin user: $_" -ForegroundColor Red
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
}
