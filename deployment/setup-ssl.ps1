# SSL Setup Script for CueFinder
# This script sets up HTTPS/SSL for your domain

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "admin@$Domain",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "116.203.137.201"
)

Write-Host "🔒 CueFinder SSL Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if domain points to server
Write-Host "Checking DNS configuration..." -ForegroundColor Yellow
$dnsResult = Resolve-DnsName -Name $Domain -ErrorAction SilentlyContinue
if ($dnsResult) {
    $resolvedIP = $dnsResult | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1 -ExpandProperty IPAddress
    Write-Host "✓ $Domain resolves to: $resolvedIP" -ForegroundColor Green
    
    if ($resolvedIP -ne $ServerIP) {
        Write-Host "⚠ Warning: Domain points to $resolvedIP but server is at $ServerIP" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') {
            exit
        }
    }
} else {
    Write-Host "⚠ Warning: Could not resolve $Domain" -ForegroundColor Yellow
    Write-Host "Make sure your DNS A record points to $ServerIP" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit
    }
}

Write-Host ""
Write-Host "Setting up SSL for $Domain..." -ForegroundColor Yellow

# Update nginx configuration with domain name
Write-Host "1. Updating Nginx configuration..." -ForegroundColor Cyan
ssh cuefinder@$ServerIP @"
sudo sed -i 's/server_name 116.203.137.201;/server_name $Domain www.$Domain;/' /etc/nginx/sites-available/cuefinder.conf
sudo nginx -t
sudo systemctl reload nginx
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Nginx configuration updated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to update Nginx configuration" -ForegroundColor Red
    exit 1
}

# Install SSL certificate with Certbot
Write-Host ""
Write-Host "2. Installing SSL certificate..." -ForegroundColor Cyan
Write-Host "   This will use Let's Encrypt (free SSL)" -ForegroundColor Gray

ssh cuefinder@$ServerIP @"
sudo certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos --email $Email --redirect
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSL certificate installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your site is now accessible at:" -ForegroundColor Green
    Write-Host "   https://$Domain" -ForegroundColor Cyan
    Write-Host "   https://www.$Domain" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "HTTP requests will automatically redirect to HTTPS" -ForegroundColor Gray
    Write-Host "Certificate will auto-renew via certbot timer" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to install SSL certificate" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - DNS not pointing to server yet (wait 5-10 minutes)" -ForegroundColor Gray
    Write-Host "  - Port 80 not accessible from internet" -ForegroundColor Gray
    Write-Host "  - Certbot rate limits (max 5 certs per domain per week)" -ForegroundColor Gray
    exit 1
}

# Test the SSL configuration
Write-Host ""
Write-Host "3. Testing SSL configuration..." -ForegroundColor Cyan
$testResult = curl.exe -I "https://$Domain" 2>&1 | Select-String "HTTP/2 200"
if ($testResult) {
    Write-Host "✓ SSL is working correctly!" -ForegroundColor Green
} else {
    Write-Host "⚠ Could not verify SSL (might take a moment to propagate)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "SSL Setup Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://$Domain in your browser" -ForegroundColor White
Write-Host "2. Update your app's API URL to use HTTPS" -ForegroundColor White
Write-Host "3. Update CORS settings if needed" -ForegroundColor White
Write-Host ""

# Usage instructions
Write-Host "Certificate auto-renewal:" -ForegroundColor Yellow
Write-Host "  - Certbot timer runs twice daily" -ForegroundColor Gray
Write-Host "  - Check status: ssh cuefinder@$ServerIP 'sudo systemctl status certbot.timer'" -ForegroundColor Gray
Write-Host "  - Manual renewal: ssh cuefinder@$ServerIP 'sudo certbot renew'" -ForegroundColor Gray
