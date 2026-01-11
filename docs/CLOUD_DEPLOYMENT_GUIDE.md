# CueFinder Cloud Deployment Guide - Hetzner
## Complete Production Deployment Instructions

### 🎯 Prerequisites
- Hetzner Cloud account
- Domain name (optional but recommended)
- SSH key pair generated
- Git repository access

---

## 📋 Part 1: Server Configuration on Hetzner

### 1.1 Server Specifications

**Recommended Server Type:**
- **CPX21** or higher (3 vCPU, 4GB RAM, 80GB SSD) - €7.71/month
- **Location:** Choose closest to your users (e.g., Nuremberg for Europe)
- **Image:** Ubuntu 22.04 LTS
- **Backups:** Enable (adds 20% cost but essential)

### 1.2 Firewall Rules

Create a firewall with these rules:

#### Inbound Rules:
```
SSH     - Port 22   - TCP - Source: YOUR_IP_ADDRESS/32
HTTP    - Port 80   - TCP - Source: 0.0.0.0/0, ::/0
HTTPS   - Port 443  - TCP - Source: 0.0.0.0/0, ::/0
API     - Port 5000 - TCP - Source: 0.0.0.0/0, ::/0 (Optional if using Nginx reverse proxy)
```

#### Outbound Rules:
```
Allow all outbound traffic (default)
```

**Security Note:** For SSH, use your specific IP address only. If you have dynamic IP, consider using a VPN or Tailscale.

### 1.3 Cloud-Init Configuration

In the Hetzner Cloud console, under "Cloud config", paste:

```yaml
#cloud-config

package_update: true
package_upgrade: true

packages:
  - docker.io
  - docker-compose
  - nginx
  - certbot
  - python3-certbot-nginx
  - ufw
  - fail2ban
  - git
  - curl
  - htop
  - net-tools

users:
  - name: cuefinder
    groups: sudo, docker
    shell: /bin/bash
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    ssh_authorized_keys:
      - ssh-rsa YOUR_SSH_PUBLIC_KEY_HERE  # REPLACE THIS!

runcmd:
  # Docker setup
  - systemctl start docker
  - systemctl enable docker
  
  # Firewall setup
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
  
  # Fail2ban for brute force protection
  - systemctl enable fail2ban
  - systemctl start fail2ban
  
  # Create app directory
  - mkdir -p /home/cuefinder/app
  - chown -R cuefinder:cuefinder /home/cuefinder
  
  # Docker logging configuration
  - echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' > /etc/docker/daemon.json
  - systemctl restart docker
  
  # Disable root login
  - sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
  - systemctl restart sshd

ssh_deletekeys: true
disable_root: true
ssh_pwauth: false
timezone: Europe/Athens

final_message: "CueFinder server ready! SSH as 'cuefinder' user."
```

**⚠️ CRITICAL:** Generate your SSH key first!

```powershell
# On your local Windows machine (PowerShell)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Display your public key
Get-Content ~/.ssh/id_rsa.pub
```

Copy the output and replace `YOUR_SSH_PUBLIC_KEY_HERE` in the cloud-init script.

### 1.4 Server Name & Labels

- **Name:** `cuefinder-prod-1` or `ubuntu-4gb-nbg1-1`
- **Labels:** 
  - `app: cuefinder`
  - `env: production`
  - `type: web-app`

---

## 📡 Part 2: Initial Server Setup

### 2.1 Connect to Your Server

```powershell
# Replace SERVER_IP with your actual server IP
ssh cuefinder@YOUR_SERVER_IP
```

### 2.2 Verify Installation

```bash
# Check Docker
docker --version
docker-compose --version

# Check firewall
sudo ufw status

# Check fail2ban
sudo fail2ban-client status
```

### 2.3 Clone Your Repository

```bash
cd /home/cuefinder/app

# Option 1: Using HTTPS (will prompt for credentials)
git clone https://github.com/tselloss/CueFinder.git .

# Option 2: Using SSH (recommended - setup GitHub SSH key first)
git clone git@github.com:tselloss/CueFinder.git .
```

---

## 🐳 Part 3: Docker Configuration for Production

### 3.1 Create Production Docker Compose Override

```bash
cd /home/cuefinder/app
nano docker-compose.prod.yml
```

Paste this configuration:

```yaml
version: '3.8'

services:
  postgres:
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Use strong password from .env
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost access
    deploy:
      resources:
        limits:
          memory: 1G

  backend:
    restart: always
    build:
      context: ./CueFinderBE
      dockerfile: Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:5000
      - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=cuefinder;Username=postgres;Password=${DB_PASSWORD}
    ports:
      - "127.0.0.1:5000:5000"  # Only localhost, Nginx will proxy
    depends_on:
      - postgres
    deploy:
      resources:
        limits:
          memory: 1G

  frontend:
    restart: always
    build:
      context: ./CueFinderFE/cuefinderfe
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=https://yourdomain.com/api  # REPLACE WITH YOUR DOMAIN
    ports:
      - "127.0.0.1:3000:80"  # Only localhost, Nginx will proxy
    depends_on:
      - backend
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  postgres_data:
    driver: local

networks:
  default:
    driver: bridge
```

### 3.2 Create Environment File

```bash
nano .env.production
```

```bash
# Database
DB_PASSWORD=YOUR_VERY_STRONG_PASSWORD_HERE_CHANGE_THIS

# Backend
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=YOUR_JWT_SECRET_MINIMUM_32_CHARACTERS_LONG_RANDOM_STRING

# Frontend
REACT_APP_API_URL=https://yourdomain.com/api

# Optional: SMS/Email services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Generate secure passwords:**
```bash
# Generate random password for DB
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

---

## 🌐 Part 4: Nginx Reverse Proxy Setup

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/cuefinder
```

```nginx
# HTTP - Redirect all to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;  # REPLACE WITH YOUR DOMAIN
    
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;  # REPLACE WITH YOUR DOMAIN
    
    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/cuefinder_access.log;
    error_log /var/log/nginx/cuefinder_error.log;
    
    # Client upload size (for image uploads)
    client_max_body_size 10M;
    
    # Frontend (React app)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }
    
    # Static files (uploaded images, etc.)
    location /uploads/ {
        alias /home/cuefinder/app/CueFinderBE/wwwroot/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4.2 Enable Site and Test

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cuefinder /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

---

## 🔐 Part 5: SSL Certificate Setup (Let's Encrypt)

### 5.1 Point Your Domain to Server

Before running Certbot, configure your domain DNS:

**A Records:**
```
@ (root domain)     -> YOUR_SERVER_IP
www                 -> YOUR_SERVER_IP
```

Wait 5-10 minutes for DNS propagation.

### 5.2 Obtain SSL Certificate

```bash
# Stop Nginx temporarily (if running on port 80)
sudo systemctl stop nginx

# Get certificate (replace with your domain and email)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  --redirect

# Start Nginx
sudo systemctl start nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

Certificate will auto-renew via cron job.

---

## 🚀 Part 6: Deploy Application

### 6.1 Build and Start Containers

```bash
cd /home/cuefinder/app

# Load production environment
export $(cat .env.production | xargs)

# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f --tail=100
```

### 6.2 Initialize Database

```bash
# Run migrations
docker exec -i cuefinder-postgres psql -U postgres -d cuefinder < scripts/add-terms-acceptance-columns-postgres.sql

# Create admin user (if needed)
docker-compose exec backend dotnet run --create-admin
# Or use the PowerShell script locally
```

---

## 📊 Part 7: Monitoring & Maintenance

### 7.1 Setup Monitoring Scripts

```bash
# Create monitoring script
nano /home/cuefinder/monitor.sh
```

```bash
#!/bin/bash

# Check if containers are running
if ! docker ps | grep -q cuefinder; then
    echo "$(date) - CueFinder containers not running!" | tee -a /var/log/cuefinder-monitor.log
    cd /home/cuefinder/app
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$(date) - Disk usage high: ${DISK_USAGE}%" | tee -a /var/log/cuefinder-monitor.log
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ "$MEM_USAGE" -gt 85 ]; then
    echo "$(date) - Memory usage high: ${MEM_USAGE}%" | tee -a /var/log/cuefinder-monitor.log
fi
```

```bash
# Make executable
chmod +x /home/cuefinder/monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/cuefinder/monitor.sh") | crontab -
```

### 7.2 Backup Strategy

```bash
# Create backup script
nano /home/cuefinder/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/cuefinder/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec cuefinder-postgres pg_dump -U postgres cuefinder | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/cuefinder/app/CueFinderBE/wwwroot/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "$(date) - Backup completed: $DATE" >> /var/log/cuefinder-backup.log
```

```bash
chmod +x /home/cuefinder/backup.sh

# Run daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/cuefinder/backup.sh") | crontab -
```

### 7.3 Log Rotation

```bash
sudo nano /etc/logrotate.d/cuefinder
```

```
/var/log/nginx/cuefinder_*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}
```

---

## 🔧 Part 8: Useful Commands

### Container Management
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart services
docker-compose restart backend frontend

# Rebuild after code changes
docker-compose build backend frontend
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it cuefinder-postgres psql -U postgres -d cuefinder

# Backup database
docker exec cuefinder-postgres pg_dump -U postgres cuefinder > backup.sql

# Restore database
docker exec -i cuefinder-postgres psql -U postgres -d cuefinder < backup.sql
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Docker stats
docker stats

# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status verbose

# Check fail2ban
sudo fail2ban-client status sshd
```

---

## 🔒 Part 9: Security Hardening

### 9.1 Additional Fail2ban Configuration

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
sudo systemctl restart fail2ban
```

### 9.2 Automatic Security Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 9.3 SSH Security

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

Ensure these settings:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers cuefinder
MaxAuthTries 3
```

```bash
sudo systemctl restart sshd
```

---

## 🎯 Part 10: Deployment Checklist

- [ ] Server created on Hetzner
- [ ] Firewall rules configured
- [ ] Cloud-init executed successfully
- [ ] SSH key authentication working
- [ ] Domain DNS configured (A records)
- [ ] Git repository cloned
- [ ] .env.production file created with secure passwords
- [ ] Docker images built successfully
- [ ] Containers running (docker-compose ps shows Up)
- [ ] Nginx configured and running
- [ ] SSL certificate obtained and auto-renewal tested
- [ ] Database initialized with migrations
- [ ] Can access application via HTTPS
- [ ] Monitoring scripts setup
- [ ] Backup scripts setup
- [ ] Fail2ban configured
- [ ] SSH hardened
- [ ] First admin user created

---

## 🆘 Troubleshooting

### Issue: Can't connect to server
```bash
# Check if server is running
ping YOUR_SERVER_IP

# Check SSH port
telnet YOUR_SERVER_IP 22
```

### Issue: Containers not starting
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

### Issue: 502 Bad Gateway (Nginx)
```bash
# Check if backend is running
docker ps | grep backend
curl http://localhost:5000/api/health

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it cuefinder-postgres psql -U postgres -d cuefinder
```

### Issue: SSL certificate not working
```bash
# Test certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx config
sudo nginx -t
```

---

## 📚 Additional Resources

- [Hetzner Cloud Docs](https://docs.hetzner.com/cloud/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Let's Encrypt Docs](https://letsencrypt.org/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 💰 Estimated Monthly Costs

- **CPX21 Server:** €7.71/month
- **Backups (20%):** €1.54/month
- **Volume (if needed):** €4.00/month per 100GB
- **Total:** ~€13-15/month

**Pro Tips:**
- Start with CPX21, scale up if needed
- Enable backups from day 1
- Use Hetzner Cloud volumes for database if you need more than 80GB
- Consider using Hetzner Cloud Load Balancer if you need multiple servers

---

**🎉 Your CueFinder app is now ready for production!**
