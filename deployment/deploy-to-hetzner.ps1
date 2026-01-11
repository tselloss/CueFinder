# CueFinder Quick Deployment Script
# Run this on your LOCAL machine to deploy to Hetzner server

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║         🎱 CueFinder Cloud Deployment Script 🎱          ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ServerUser = "cuefinder"
$AppPath = "/home/cuefinder/app"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Server IP: $ServerIP" -ForegroundColor Gray
Write-Host "   User: $ServerUser" -ForegroundColor Gray
Write-Host "   Domain: $(if($Domain){"$Domain"}else{"Not configured"})" -ForegroundColor Gray
Write-Host ""

# Step 1: Test SSH connection
Write-Host "🔐 Step 1: Testing SSH connection..." -ForegroundColor Yellow
try {
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "echo 'SSH connection successful'" 2>&1 | Out-Null
    Write-Host "   ✓ SSH connection verified" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Cannot connect to server. Please check:" -ForegroundColor Red
    Write-Host "     - Server IP is correct: $ServerIP" -ForegroundColor Red
    Write-Host "     - SSH key is in ~/.ssh/id_rsa" -ForegroundColor Red
    Write-Host "     - Server firewall allows your IP" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Clone repository (if not exists)
Write-Host "📦 Step 2: Setting up application directory..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerIP}" @"
if [ ! -d $AppPath/.git ]; then
    echo '   → Cloning repository...'
    mkdir -p $AppPath
    cd $AppPath
    git clone https://github.com/tselloss/CueFinder.git .
else
    echo '   → Repository already exists, pulling latest changes...'
    cd $AppPath
    git pull
fi
"@
Write-Host "   ✓ Repository ready" -ForegroundColor Green
Write-Host ""

# Step 3: Copy/Create environment file
Write-Host "🔧 Step 3: Checking environment configuration..." -ForegroundColor Yellow
$localEnvPath = ".\.env.production"

if (Test-Path $localEnvPath) {
    Write-Host "   → Uploading .env.production from local machine..." -ForegroundColor Gray
    scp "$localEnvPath" "${ServerUser}@${ServerIP}:${AppPath}/.env.production"
    Write-Host "   ✓ Environment file uploaded" -ForegroundColor Green
} else {
    Write-Host "   ⚠ .env.production not found locally" -ForegroundColor Yellow
    
    ssh "${ServerUser}@${ServerIP}" @"
if [ ! -f $AppPath/.env.production ]; then
    echo '   → Creating .env.production from example...'
    cp $AppPath/.env.production.example $AppPath/.env.production
    echo '   ⚠ IMPORTANT: Edit .env.production on server with actual values!'
    echo ''
    echo '   Run this command after deployment:'
    echo '   ssh $ServerUser@$ServerIP'
    echo '   nano /home/cuefinder/app/.env.production'
else
    echo '   → .env.production already exists on server'
fi
"@
}
Write-Host ""

# Step 4: Create data directories
Write-Host "📁 Step 4: Creating data directories..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerIP}" @"
mkdir -p /home/cuefinder/data/postgres
mkdir -p /home/cuefinder/backups
mkdir -p $AppPath/CueFinderBE/wwwroot/uploads
chown -R cuefinder:cuefinder /home/cuefinder
chmod -R 755 /home/cuefinder/data
chmod -R 777 $AppPath/CueFinderBE/wwwroot/uploads
"@
Write-Host "   ✓ Directories created" -ForegroundColor Green
Write-Host ""

# Step 5: Build and deploy containers
if (-not $SkipBuild) {
    Write-Host "🐳 Step 5: Building and starting Docker containers..." -ForegroundColor Yellow
    Write-Host "   (This may take 5-10 minutes on first run)" -ForegroundColor Gray
    
    ssh "${ServerUser}@${ServerIP}" @"
cd $AppPath
export \$(cat .env.production | grep -v '^#' | xargs)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
"@
    Write-Host "   ✓ Containers started" -ForegroundColor Green
} else {
    Write-Host "🐳 Step 5: Skipping build (--SkipBuild flag)" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Run database migrations
Write-Host "🗄 Step 6: Running database migrations..." -ForegroundColor Yellow
Start-Sleep -Seconds 10  # Wait for PostgreSQL to be ready

ssh "${ServerUser}@${ServerIP}" @"
cd $AppPath
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder < scripts/add-terms-acceptance-columns-postgres.sql 2>&1 | grep -E '(NOTICE|ERROR)' || echo '   ✓ Migrations applied'
"@
Write-Host "   ✓ Database initialized" -ForegroundColor Green
Write-Host ""

# Step 7: Check container status
Write-Host "📊 Step 7: Checking container status..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerIP}" "cd $AppPath && docker-compose ps"
Write-Host ""

# Step 8: Setup Nginx (if domain provided)
if ($Domain) {
    Write-Host "🌐 Step 8: Configuring Nginx reverse proxy..." -ForegroundColor Yellow
    
    $nginxConfig = @"
server {
    listen 80;
    listen [::]:80;
    server_name $Domain www.$Domain;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \`$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \`$host;
        proxy_cache_bypass \`$http_upgrade;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \`$host;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }
    
    location /uploads/ {
        alias /home/cuefinder/app/CueFinderBE/wwwroot/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    client_max_body_size 10M;
}
"@
    
    # Save config to temp file
    $tempNginxConfig = [System.IO.Path]::GetTempFileName()
    $nginxConfig | Out-File -FilePath $tempNginxConfig -Encoding UTF8
    
    # Upload and configure Nginx
    scp "$tempNginxConfig" "${ServerUser}@${ServerIP}:/tmp/cuefinder-nginx.conf"
    Remove-Item $tempNginxConfig
    
    ssh "${ServerUser}@${ServerIP}" @"
sudo mv /tmp/cuefinder-nginx.conf /etc/nginx/sites-available/cuefinder
sudo ln -sf /etc/nginx/sites-available/cuefinder /etc/nginx/sites-enabled/cuefinder
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
"@
    
    Write-Host "   ✓ Nginx configured" -ForegroundColor Green
    Write-Host ""
    
    # Step 9: Setup SSL
    Write-Host "🔒 Step 9: Setting up SSL certificate..." -ForegroundColor Yellow
    Write-Host "   Make sure DNS A record points to $ServerIP" -ForegroundColor Gray
    Write-Host ""
    
    $setupSSL = Read-Host "   Setup SSL with Let's Encrypt now? (y/n)"
    
    if ($setupSSL -eq "y") {
        $adminEmail = Read-Host "   Enter admin email for SSL certificate"
        
        ssh "${ServerUser}@${ServerIP}" @"
sudo systemctl stop nginx
sudo certbot certonly --standalone -d $Domain -d www.$Domain --email $adminEmail --agree-tos --no-eff-email
sudo systemctl start nginx
"@
        
        Write-Host "   ✓ SSL certificate obtained" -ForegroundColor Green
        
        # Update Nginx config with SSL
        Write-Host "   → Updating Nginx config for HTTPS..." -ForegroundColor Gray
        
        ssh "${ServerUser}@${ServerIP}" @"
sudo tee /etc/nginx/sites-available/cuefinder > /dev/null <<'EOFNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name $Domain www.$Domain;
    return 301 https://\`$server_name\`$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $Domain www.$Domain;
    
    ssl_certificate /etc/letsencrypt/live/$Domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$Domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \`$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \`$host;
        proxy_cache_bypass \`$http_upgrade;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \`$host;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }
    
    location /uploads/ {
        alias /home/cuefinder/app/CueFinderBE/wwwroot/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    client_max_body_size 10M;
}
EOFNGINX

sudo nginx -t && sudo systemctl reload nginx
"@
        
        Write-Host "   ✓ HTTPS enabled" -ForegroundColor Green
    }
} else {
    Write-Host "🌐 Step 8: Skipping Nginx setup (no domain provided)" -ForegroundColor Yellow
    Write-Host "   Access application at: http://${ServerIP}:3000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "║            ✅ Deployment Completed Successfully! ✅       ║" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Next Steps:" -ForegroundColor Cyan
Write-Host ""

if ($Domain) {
    Write-Host "   🌐 Your site: https://$Domain" -ForegroundColor Green
} else {
    Write-Host "   🌐 Your site: http://${ServerIP}:3000" -ForegroundColor Yellow
    Write-Host "   💡 Recommended: Setup domain and SSL for production" -ForegroundColor Gray
}

Write-Host ""
Write-Host "   📱 Connect to server:" -ForegroundColor Yellow
Write-Host "      ssh $ServerUser@$ServerIP" -ForegroundColor Gray
Write-Host ""
Write-Host "   📊 Check status:" -ForegroundColor Yellow
Write-Host "      ssh $ServerUser@$ServerIP 'cd $AppPath && docker-compose ps'" -ForegroundColor Gray
Write-Host ""
Write-Host "   📋 View logs:" -ForegroundColor Yellow
Write-Host "      ssh $ServerUser@$ServerIP 'cd $AppPath && docker-compose logs -f'" -ForegroundColor Gray
Write-Host ""
Write-Host "   🔄 Restart services:" -ForegroundColor Yellow
Write-Host "      ssh $ServerUser@$ServerIP 'cd $AppPath && docker-compose restart'" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠ Important Reminders:" -ForegroundColor Red
Write-Host "   1. Edit .env.production on server with real passwords" -ForegroundColor Yellow
Write-Host "   2. Create admin user account" -ForegroundColor Yellow
Write-Host "   3. Test registration and login" -ForegroundColor Yellow
Write-Host "   4. Setup monitoring and backups" -ForegroundColor Yellow
Write-Host "   5. Configure domain DNS if not done yet" -ForegroundColor Yellow
Write-Host ""
