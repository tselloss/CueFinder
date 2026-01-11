# Check if Your Public IP Has Changed
# Run this periodically to monitor your IP address

$ErrorActionPreference = "Stop"

Write-Host "🔍 Checking Your Public IP Address..." -ForegroundColor Cyan
Write-Host ""

# Saved IP (what you configured in Hetzner)
$SavedIP = "94.70.71.16"

# Get current IP
try {
    $CurrentIP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json").ip
    
    Write-Host "📍 Current IP:  $CurrentIP" -ForegroundColor Green
    Write-Host "💾 Saved IP:    $SavedIP" -ForegroundColor Yellow
    Write-Host ""
    
    if ($CurrentIP -eq $SavedIP) {
        Write-Host "✅ IP addresses match - No action needed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Your IP has changed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Old IP: $SavedIP" -ForegroundColor Yellow
        Write-Host "New IP: $CurrentIP" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔧 Actions Required:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Update Hetzner Firewall:" -ForegroundColor Yellow
        Write-Host "   → Go to: https://console.hetzner.cloud/" -ForegroundColor Gray
        Write-Host "   → Firewalls → cuefinder-firewall → Edit Rule 1" -ForegroundColor Gray
        Write-Host "   → Change Source IP to: $CurrentIP/32" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Update Server Firewall (Optional):" -ForegroundColor Yellow
        Write-Host "   → ssh cuefinder@YOUR_SERVER_IP" -ForegroundColor Gray
        Write-Host "   → ./update-ssh-ip.sh $CurrentIP" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Update this script:" -ForegroundColor Yellow
        Write-Host "   → Edit this file and change line 8:" -ForegroundColor Gray
        Write-Host "   → `$SavedIP = `"$CurrentIP`"" -ForegroundColor Gray
        Write-Host ""
        
        # Try to copy new IP to clipboard
        try {
            Set-Clipboard -Value "$CurrentIP/32"
            Write-Host "📋 Copied to clipboard: $CurrentIP/32" -ForegroundColor Green
            Write-Host "   (Paste directly in Hetzner firewall rule)" -ForegroundColor Gray
        } catch {
            # Clipboard might not be available
        }
    }
    
} catch {
    Write-Host "❌ Error checking IP address" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative methods to check IP:" -ForegroundColor Cyan
    Write-Host "  • Visit: https://whatismyipaddress.com/" -ForegroundColor Gray
    Write-Host "  • Google: 'what is my ip'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Show IP details
if ($CurrentIP) {
    Write-Host "📊 IP Address Details:" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $IPInfo = Invoke-RestMethod -Uri "https://ipinfo.io/$CurrentIP/json"
        
        Write-Host "  IP:           $($IPInfo.ip)" -ForegroundColor Gray
        Write-Host "  City:         $($IPInfo.city)" -ForegroundColor Gray
        Write-Host "  Region:       $($IPInfo.region)" -ForegroundColor Gray
        Write-Host "  Country:      $($IPInfo.country)" -ForegroundColor Gray
        Write-Host "  ISP:          $($IPInfo.org)" -ForegroundColor Gray
        Write-Host "  Timezone:     $($IPInfo.timezone)" -ForegroundColor Gray
        
    } catch {
        Write-Host "  (Details not available)" -ForegroundColor DarkGray
    }
    
    Write-Host ""
    Write-Host "  More info:    https://ipinfo.io/$CurrentIP" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 Tip: Run this script regularly or create a scheduled task" -ForegroundColor Yellow
Write-Host "   Task Scheduler: schtasks /create /tn `"Check IP`" /tr `"powershell -File check-ip.ps1`" /sc daily /st 08:00" -ForegroundColor DarkGray
Write-Host ""
