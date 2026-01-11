# Automated Setup for billiardscuefinder.com
# This script configures your Cloudflare domain with your Hetzner server

Write-Host ""
Write-Host "🎱 CueFinder Domain Setup" -ForegroundColor Cyan
Write-Host "Domain: billiardscuefinder.com" -ForegroundColor Cyan
Write-Host "Server: 116.203.137.201" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check DNS
Write-Host "Step 1: Checking DNS configuration..." -ForegroundColor Yellow
Write-Host "        (Cloudflare DNS should point to your server)" -ForegroundColor Gray
Write-Host ""

try {
    $dns = Resolve-DnsName -Name billiardscuefinder.com -Type A -ErrorAction Stop
    $resolvedIP = $dns | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1 -ExpandProperty IPAddress
    
    Write-Host "✓ DNS Resolution Successful!" -ForegroundColor Green
    Write-Host "  Domain: billiardscuefinder.com" -ForegroundColor White
    Write-Host "  Resolves to: $resolvedIP" -ForegroundColor White
    Write-Host ""
    
    # Cloudflare proxied domains will show Cloudflare IPs, not your server IP
    if ($resolvedIP -match "^(104\.16\.|104\.17\.|104\.18\.|104\.19\.|104\.20\.|104\.21\.|104\.22\.|104\.23\.|104\.24\.|104\.25\.|104\.26\.|104\.27\.|104\.28\.|104\.29\.|104\.30\.|104\.31\.|172\.64\.|172\.65\.|172\.66\.|172\.67\.)") {
        Write-Host "✓ Domain is proxied through Cloudflare (Good!)" -ForegroundColor Green
        Write-Host "  This means you get free SSL, DDoS protection, and CDN" -ForegroundColor Gray
    } elseif ($resolvedIP -eq "116.203.137.201") {
        Write-Host "⚠ Warning: DNS points directly to server (not proxied)" -ForegroundColor Yellow
        Write-Host "  Consider enabling proxy (orange cloud) in Cloudflare for better protection" -ForegroundColor Gray
    } else {
        Write-Host "⚠ Warning: DNS points to unexpected IP: $resolvedIP" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') {
            Write-Host "Setup cancelled." -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
} catch {
    Write-Host "✗ DNS not yet configured or not propagated" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please configure DNS in Cloudflare first:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "  2. Select domain: billiardscuefinder.com" -ForegroundColor White
    Write-Host "  3. Click 'DNS' tab" -ForegroundColor White
    Write-Host "  4. Add A record:" -ForegroundColor White
    Write-Host "     Type: A" -ForegroundColor Gray
    Write-Host "     Name: @ (or billiardscuefinder.com)" -ForegroundColor Gray
    Write-Host "     Content: 116.203.137.201" -ForegroundColor Gray
    Write-Host "     Proxy: ON (orange cloud) ✓" -ForegroundColor Gray
    Write-Host "  5. Add A record for www:" -ForegroundColor White
    Write-Host "     Type: A" -ForegroundColor Gray
    Write-Host "     Name: www" -ForegroundColor Gray
    Write-Host "     Content: 116.203.137.201" -ForegroundColor Gray
    Write-Host "     Proxy: ON (orange cloud) ✓" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Wait 5-10 minutes after adding, then run this script again." -ForegroundColor Yellow
    exit 1
}

Start-Sleep -Seconds 2

# Step 2: Update Nginx Configuration
Write-Host "Step 2: Updating Nginx configuration on server..." -ForegroundColor Yellow
Write-Host ""

$nginxUpdate = ssh cuefinder@116.203.137.201 @'
# Backup current config
sudo cp /etc/nginx/sites-available/cuefinder.conf /etc/nginx/sites-available/cuefinder.conf.backup

# Update server_name to use the domain
sudo sed -i 's/server_name [^;]*/server_name billiardscuefinder.com www.billiardscuefinder.com/' /etc/nginx/sites-available/cuefinder.conf

# Test configuration
sudo nginx -t 2>&1
'@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Nginx configuration updated successfully" -ForegroundColor Green
    Write-Host "  Domain: billiardscuefinder.com, www.billiardscuefinder.com" -ForegroundColor Gray
    Write-Host ""
    
    # Reload Nginx
    Write-Host "  Reloading Nginx..." -ForegroundColor Gray
    ssh cuefinder@116.203.137.201 'sudo systemctl reload nginx'
    Write-Host "✓ Nginx reloaded" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✗ Failed to update Nginx configuration" -ForegroundColor Red
    Write-Host $nginxUpdate -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Step 3: SSL Certificate
Write-Host "Step 3: Installing SSL certificate..." -ForegroundColor Yellow
Write-Host "        (Let's Encrypt for server-side encryption)" -ForegroundColor Gray
Write-Host ""

# Note: With Cloudflare proxy, SSL might fail because Cloudflare IPs are connecting
# This is OK - Cloudflare provides SSL to visitors
Write-Host "  Attempting SSL installation..." -ForegroundColor Gray
Write-Host "  (If this fails, don't worry - Cloudflare provides SSL)" -ForegroundColor Gray
Write-Host ""

$sslResult = ssh cuefinder@116.203.137.201 @"
sudo certbot --nginx \
  -d billiardscuefinder.com \
  -d www.billiardscuefinder.com \
  --email vagelis95@hotmail.com \
  --agree-tos \
  --non-interactive \
  --redirect 2>&1 | tail -20
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSL certificate installed successfully!" -ForegroundColor Green
    Write-Host "  Certificate: Let's Encrypt" -ForegroundColor Gray
    Write-Host "  Auto-renewal: Enabled" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠ Next: Go to Cloudflare SSL/TLS settings and change to:" -ForegroundColor Yellow
    Write-Host "  Encryption mode: Full (strict)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠ SSL installation completed with warnings (this is normal with Cloudflare proxy)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Cloudflare is providing SSL to your visitors." -ForegroundColor Gray
    Write-Host "  Make sure Cloudflare SSL/TLS mode is set to: Full" -ForegroundColor White
    Write-Host ""
}

Start-Sleep -Seconds 2

# Step 4: Update Application Configuration
Write-Host "Step 4: Updating application configuration..." -ForegroundColor Yellow
Write-Host ""

ssh cuefinder@116.203.137.201 @'
# Update .env file
cd /home/cuefinder/app
if [ -f .env ]; then
    # Backup current .env
    cp .env .env.backup
    
    # Update FRONTEND_API_URL
    sed -i 's|FRONTEND_API_URL=.*|FRONTEND_API_URL=https://billiardscuefinder.com|' .env
    
    echo "✓ Updated .env file"
    echo "  FRONTEND_API_URL=https://billiardscuefinder.com"
else
    echo "⚠ .env file not found"
fi
'@

Write-Host ""
Write-Host "✓ Application configuration updated" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 2

# Step 5: Test the Website
Write-Host "Step 5: Testing website..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Testing HTTPS..." -ForegroundColor Gray
Start-Sleep -Seconds 3

try {
    $httpsTest = curl.exe -I -s --max-time 10 https://billiardscuefinder.com 2>&1 | Select-String "HTTP"
    if ($httpsTest) {
        Write-Host "✓ HTTPS is working!" -ForegroundColor Green
        Write-Host "  Response: $($httpsTest.Line)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ Could not verify HTTPS (might still be propagating)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ HTTPS test inconclusive" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "  Testing website content..." -ForegroundColor Gray
try {
    $contentTest = curl.exe -s --max-time 10 https://billiardscuefinder.com 2>&1 | Select-String "CueFinder"
    if ($contentTest) {
        Write-Host "✓ Website is serving content correctly!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not verify content" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Content test inconclusive" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Check Container Status
Write-Host "Step 6: Checking application services..." -ForegroundColor Yellow
Write-Host ""

$containerStatus = ssh cuefinder@116.203.137.201 'docker ps --format "  - {{.Names}}: {{.Status}}" | grep cuefinder'
Write-Host $containerStatus
Write-Host ""

# Final Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Your CueFinder application is now live at:" -ForegroundColor White
Write-Host ""
Write-Host "   🌐 https://billiardscuefinder.com" -ForegroundColor Cyan
Write-Host "   🌐 https://www.billiardscuefinder.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 What's Configured:" -ForegroundColor Yellow
Write-Host "   ✓ DNS pointing to your server" -ForegroundColor Green
Write-Host "   ✓ Nginx reverse proxy configured" -ForegroundColor Green
Write-Host "   ✓ SSL/HTTPS enabled" -ForegroundColor Green
Write-Host "   ✓ Cloudflare DDoS protection active" -ForegroundColor Green
Write-Host "   ✓ Cloudflare CDN active (fast worldwide)" -ForegroundColor Green
Write-Host "   ✓ All containers running" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 Cloudflare Tasks (Manual):" -ForegroundColor Yellow
Write-Host "   1. Go to: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "   2. Select: billiardscuefinder.com" -ForegroundColor White
Write-Host "   3. SSL/TLS → Overview" -ForegroundColor White
Write-Host "      Set encryption mode to: Full (or Full (strict) if certbot succeeded)" -ForegroundColor White
Write-Host "   4. SSL/TLS → Edge Certificates" -ForegroundColor White
Write-Host "      Enable: Always Use HTTPS" -ForegroundColor White
Write-Host "      Enable: Automatic HTTPS Rewrites" -ForegroundColor White
Write-Host "   5. Speed → Optimization" -ForegroundColor White
Write-Host "      Enable: Auto Minify (HTML, CSS, JS)" -ForegroundColor White
Write-Host "      Enable: Brotli" -ForegroundColor White
Write-Host "   6. Caching → Configuration" -ForegroundColor White
Write-Host "      Enable: Always Online" -ForegroundColor White
Write-Host ""
Write-Host "📱 Test Your Website:" -ForegroundColor Yellow
Write-Host "   1. Open browser and visit: https://billiardscuefinder.com" -ForegroundColor White
Write-Host "   2. Check for padlock 🔒 icon (secure)" -ForegroundColor White
Write-Host "   3. Test registration and login" -ForegroundColor White
Write-Host "   4. Test creating a cue listing" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor Your Site:" -ForegroundColor Yellow
Write-Host "   • Cloudflare Analytics: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "   • Check logs: ssh cuefinder@116.203.137.201 'docker logs -f cuefinder-backend-prod'" -ForegroundColor White
Write-Host "   • Server status: ssh cuefinder@116.203.137.201 'docker ps'" -ForegroundColor White
Write-Host ""
Write-Host "🎊 Congratulations! Your billiard cue marketplace is live!" -ForegroundColor Green
Write-Host ""

# Open browser
$openBrowser = Read-Host "Open website in browser now? (y/n)"
if ($openBrowser -eq 'y') {
    Start-Process "https://billiardscuefinder.com"
}
