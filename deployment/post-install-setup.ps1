# Post-Installation Setup Script for CueFinder
# Run this after Ubuntu is installed and rebooted

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP = "116.203.137.201"
)

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🎱 CueFinder Post-Installation Setup Script 🎱      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Wait for server to be accessible
Write-Host "⏳ Waiting for server to be accessible..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$connected = $false

while ($attempt -lt $maxAttempts -and !$connected) {
    try {
        ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "root@${ServerIP}" "echo 'Server accessible'" 2>&1 | Out-Null
        $connected = $true
        Write-Host "   ✓ Server is accessible!" -ForegroundColor Green
    } catch {
        $attempt++
        Write-Host "   Attempt $attempt/$maxAttempts - waiting..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

if (!$connected) {
    Write-Host "   ✗ Cannot connect to server after reboot" -ForegroundColor Red
    exit 1
}

# Step 2: Copy cloud-init configuration
Write-Host ""
Write-Host "📋 Step 1: Uploading cloud-init configuration..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no ".\deployment\hetzner-cloud-init-ready.yaml" "root@${ServerIP}:/tmp/cloud-init.yaml"
Write-Host "   ✓ Configuration uploaded" -ForegroundColor Green

# Step 3: Run cloud-init setup commands
Write-Host ""
Write-Host "⚙️  Step 2: Setting up server..." -ForegroundColor Yellow

$setupScript = @'
#!/bin/bash
set -e

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install cloud-init
echo "Installing cloud-init..."
apt-get install -y cloud-init

# Apply cloud-init configuration
echo "Applying cloud-init configuration..."
cp /tmp/cloud-init.yaml /etc/cloud/cloud.cfg.d/99_custom.cfg
cloud-init clean
cloud-init init
cloud-init modules --mode=config
cloud-init modules --mode=final

echo "Setup complete!"
'@

# Upload and run setup script
$setupScript | ssh "root@${ServerIP}" "cat > /tmp/setup.sh && chmod +x /tmp/setup.sh && bash /tmp/setup.sh"

Write-Host "   ✓ Server setup completed" -ForegroundColor Green

# Step 4: Copy SSH key to cuefinder user
Write-Host ""
Write-Host "🔐 Step 3: Setting up cuefinder user..." -ForegroundColor Yellow
$sshKey = Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub"

ssh "root@${ServerIP}" @"
# Add SSH key to cuefinder user
mkdir -p /home/cuefinder/.ssh
echo '$sshKey' > /home/cuefinder/.ssh/authorized_keys
chmod 700 /home/cuefinder/.ssh
chmod 600 /home/cuefinder/.ssh/authorized_keys
chown -R cuefinder:cuefinder /home/cuefinder/.ssh

# Disable root SSH login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
"@

Write-Host "   ✓ User configuration completed" -ForegroundColor Green

# Step 5: Test connection as cuefinder user
Write-Host ""
Write-Host "✅ Step 4: Testing cuefinder user connection..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "cuefinder@${ServerIP}" "echo 'Successfully connected as cuefinder user'"
Write-Host "   ✓ Connection successful!" -ForegroundColor Green

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   ✓ Setup Complete! ✓                    ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\deployment\deploy-to-hetzner.ps1 -ServerIP $ServerIP" -ForegroundColor White
Write-Host ""
