# 🚀 CueFinder Quick Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Hetzner Cloud Console Setup
- [ ] Create Hetzner account
- [ ] Add payment method
- [ ] Generate SSH key: `ssh-keygen -t rsa -b 4096`
- [ ] Copy public key: `Get-Content ~/.ssh/id_rsa.pub`

### 2. Server Creation
- [ ] Choose **CPX21** or higher (4GB RAM minimum)
- [ ] Select **Ubuntu 22.04 LTS**
- [ ] Enable **Backups** (recommended)
- [ ] Add your server to a **Firewall**
- [ ] Paste **cloud-init** script from `deployment/hetzner-cloud-init.yaml`
- [ ] Add **Labels**: `app: cuefinder`, `env: production`

### 3. Firewall Configuration
```
Inbound Rules:
  SSH     - 22/TCP   - YOUR_IP_ADDRESS/32
  HTTP    - 80/TCP   - 0.0.0.0/0, ::/0
  HTTPS   - 443/TCP  - 0.0.0.0/0, ::/0
```

### 4. Domain Setup (Optional but Recommended)
- [ ] Register domain (Namecheap, GoDaddy, etc.)
- [ ] Add A records:
  ```
  @   -> YOUR_SERVER_IP
  www -> YOUR_SERVER_IP
  ```
- [ ] Wait 5-10 minutes for DNS propagation

---

## 🎯 Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

```powershell
# From your LOCAL Windows machine
cd C:\Users\karac\source\repos\CueFinder

# Without domain (HTTP only)
.\deployment\deploy-to-hetzner.ps1 -ServerIP YOUR_SERVER_IP

# With domain (HTTPS with SSL)
.\deployment\deploy-to-hetzner.ps1 -ServerIP YOUR_SERVER_IP -Domain yourdomain.com
```

### Method 2: Manual Deployment

#### Step 1: Connect to Server
```powershell
ssh cuefinder@YOUR_SERVER_IP
```

#### Step 2: Clone Repository
```bash
cd /home/cuefinder/app
git clone https://github.com/tselloss/CueFinder.git .
```

#### Step 3: Configure Environment
```bash
# Copy example
cp .env.production.example .env.production

# Edit with nano or vim
nano .env.production
```

**Required values to change:**
```bash
DB_PASSWORD=<generate with: openssl rand -base64 32>
JWT_SECRET=<generate with: openssl rand -base64 64>
FRONTEND_API_URL=https://yourdomain.com/api  # or http://SERVER_IP:5000/api
```

#### Step 4: Create Data Directories
```bash
mkdir -p /home/cuefinder/data/postgres
mkdir -p /home/cuefinder/backups
mkdir -p /home/cuefinder/app/CueFinderBE/wwwroot/uploads
chmod -R 777 /home/cuefinder/app/CueFinderBE/wwwroot/uploads
```

#### Step 5: Build and Start Containers
```bash
cd /home/cuefinder/app
export $(cat .env.production | grep -v '^#' | xargs)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### Step 6: Run Database Migrations
```bash
# Wait 10 seconds for PostgreSQL to start
sleep 10

# Run migrations
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder < scripts/add-terms-acceptance-columns-postgres.sql
```

#### Step 7: Check Status
```bash
docker-compose ps
docker-compose logs -f
```

---

## 🌐 Nginx & SSL Setup (for Domain)

### Step 1: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/cuefinder
```

Paste configuration from `docs/CLOUD_DEPLOYMENT_GUIDE.md` (section 4.1)

```bash
sudo ln -s /etc/nginx/sites-available/cuefinder /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 2: Get SSL Certificate
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos
sudo systemctl start nginx
```

### Step 3: Update Nginx for HTTPS
Edit `/etc/nginx/sites-available/cuefinder` to add SSL configuration (see guide section 4.1)

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Post-Deployment Verification

### 1. Check All Services Running
```bash
ssh cuefinder@YOUR_SERVER_IP
cd /home/cuefinder/app
./health-check.sh
```

Expected output:
```
✓ Docker is running
✓ 3 containers running (postgres, backend, frontend)
✓ Nginx is running
✓ Firewall active
```

### 2. Test Application Access

**Without Domain:**
```
http://YOUR_SERVER_IP:3000  (frontend)
http://YOUR_SERVER_IP:5000/api/health  (backend)
```

**With Domain:**
```
https://yourdomain.com  (frontend)
https://yourdomain.com/api/health  (backend)
```

### 3. Test Registration Flow
- [ ] Open website
- [ ] Click "Register"
- [ ] Fill in form and accept terms
- [ ] Submit registration
- [ ] Verify SMS code (if configured)
- [ ] Check user created in database

### 4. Verify Database
```bash
docker exec -it cuefinder-postgres-prod psql -U postgres -d cuefinder

# Check users
SELECT Username, AcceptedTerms, AcceptedTermsAt FROM "Users";

# Exit
\q
```

---

## 🔧 Common Commands

### Container Management
```bash
# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart services
docker-compose restart backend frontend

# Rebuild after changes
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose up -d

# Stop all
docker-compose down

# Check status
docker-compose ps
docker stats
```

### Database Commands
```bash
# Backup database
docker exec cuefinder-postgres-prod pg_dump -U postgres cuefinder | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip < backup_20260110.sql.gz | docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder

# Access database
docker exec -it cuefinder-postgres-prod psql -U postgres -d cuefinder
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop

# Check firewall
sudo ufw status verbose

# Check fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Log Management
```bash
# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# View system logs
journalctl -u docker -f
journalctl -u nginx -f
```

---

## 🔄 Update Application

### Update Code
```bash
cd /home/cuefinder/app
git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose up -d
```

### Run New Migrations
```bash
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder < scripts/new-migration.sql
```

### Zero-Downtime Update
```bash
# Build new images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Restart one service at a time
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

---

## 🆘 Troubleshooting

### Issue: Can't SSH to server
```bash
# From local machine
ping YOUR_SERVER_IP
telnet YOUR_SERVER_IP 22

# Check firewall allows your IP
# Update firewall in Hetzner console if needed
```

### Issue: Container won't start
```bash
# Check logs
docker-compose logs backend

# Check resources
docker stats
free -h
df -h

# Check .env file
cat .env.production | grep -v '#'
```

### Issue: 502 Bad Gateway
```bash
# Check if backend is running
docker ps
curl http://localhost:5000/api/health

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -i cuefinder-postgres-prod psql -U postgres -c "SELECT 1"

# Check password in .env matches docker-compose
```

### Issue: Images not uploading
```bash
# Check upload directory permissions
ls -la /home/cuefinder/app/CueFinderBE/wwwroot/uploads
chmod -R 777 /home/cuefinder/app/CueFinderBE/wwwroot/uploads

# Check max upload size in Nginx
grep client_max_body_size /etc/nginx/sites-available/cuefinder
```

---

## 📚 Important Files Locations

### On Server
```
/home/cuefinder/app/                          # Application code
/home/cuefinder/app/.env.production           # Environment variables
/home/cuefinder/data/postgres/                # Database data
/home/cuefinder/backups/                      # Database backups
/home/cuefinder/app/CueFinderBE/wwwroot/uploads/  # Uploaded images
/etc/nginx/sites-available/cuefinder          # Nginx config
/var/log/nginx/                               # Nginx logs
```

### In Repository
```
docs/CLOUD_DEPLOYMENT_GUIDE.md                # Full deployment guide
deployment/hetzner-cloud-init.yaml            # Server initialization
deployment/deploy-to-hetzner.ps1              # Automated deployment
docker-compose.prod.yml                       # Production Docker config
.env.production.example                       # Environment template
```

---

## 💰 Cost Estimate

**Monthly Costs:**
- CPX21 Server: €7.71
- Backups (20%): €1.54
- **Total: ~€9.25/month**

**Optional Add-ons:**
- Domain: ~€10-15/year
- Additional storage volume: €4/100GB/month
- Load balancer: €5.83/month

---

## 📞 Support & Resources

- **Hetzner Cloud Docs:** https://docs.hetzner.com/cloud/
- **Docker Docs:** https://docs.docker.com/
- **Nginx Docs:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/

---

## ✅ Final Checklist

- [ ] Server created and accessible via SSH
- [ ] Firewall configured correctly
- [ ] Code deployed from Git
- [ ] .env.production configured with secure passwords
- [ ] Docker containers running
- [ ] Database migrations applied
- [ ] Nginx configured (if using domain)
- [ ] SSL certificate obtained (if using domain)
- [ ] Can access application in browser
- [ ] Registration and login working
- [ ] Image uploads working
- [ ] Backups configured
- [ ] Monitoring setup complete
- [ ] Domain DNS configured (if applicable)

---

**🎉 Your CueFinder application is now live!**

For detailed explanations, see: `docs/CLOUD_DEPLOYMENT_GUIDE.md`
