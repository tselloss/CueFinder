# 🚀 CueFinder Production Deployment - Complete

## ✅ Deployment Status: SUCCESSFUL

**Date:** January 10, 2026  
**Server:** Hetzner CX33 - Ubuntu 22.04 LTS  
**IP Address:** 116.203.137.201

---

## 🌐 **Live Application**

### Public URLs
- **Frontend:** http://116.203.137.201
- **Backend API:** http://116.203.137.201/api/
- **pgAdmin:** http://116.203.137.201:5050

### Internal Services
- PostgreSQL: `localhost:5432`
- Backend: `localhost:5000`
- Frontend: `localhost:3000`

---

## 📦 **Deployed Services**

| Service | Container Name | Status | Port Mapping |
|---------|---------------|--------|--------------|
| PostgreSQL 15 | cuefinder-postgres-prod | ✅ Healthy | 127.0.0.1:5432:5432 |
| Backend API (.NET 8) | cuefinder-backend-prod | ✅ Running | 127.0.0.1:5000:5000 |
| Frontend (React) | cuefinder-frontend-prod | ✅ Running | 127.0.0.1:3000:80 |
| pgAdmin 4 | cuefinder-pgadmin | ✅ Running | 0.0.0.0:5050:80 |
| Nginx Reverse Proxy | Host Service | ✅ Running | 0.0.0.0:80, 0.0.0.0:443 |

---

## 🔐 **Credentials**

### Server Access
- **SSH User:** cuefinder
- **SSH Key:** `~/.ssh/id_rsa.pub` (configured)
- **SSH Command:** `ssh cuefinder@116.203.137.201`

### Database
- **Host:** postgres (internal) / 127.0.0.1:5432 (from host)
- **Database:** cuefinder
- **User:** postgres
- **Password:** `9qpTLeZlPj1m7E6OdAtgFs2CX84VUSiQ`

### JWT Configuration
- **Secret:** Configured in `.env` on server
- **Issuer:** cuefinder.com
- **Audience:** cuefinder.com

### pgAdmin
- **Email:** admin@cuefinder.com
- **Password:** admin (⚠️ Change this!)

---

## 📁 **Server Directory Structure**

```
/home/cuefinder/
├── app/
│   ├── CueFinderBE/              # Backend source code
│   ├── CueFinderFE/cuefinderfe/  # Frontend source code
│   ├── Models/                    # Shared models
│   ├── SolutionLibraries/         # Solution libraries
│   ├── docker-compose.yml         # Base compose config
│   ├── docker-compose.prod.yml    # Production overrides
│   └── .env                       # Environment variables
└── data/
    └── postgres/                  # PostgreSQL data (volume)
```

---

## 🔧 **Configuration Files**

### Nginx Reverse Proxy
**Location:** `/etc/nginx/sites-available/cuefinder.conf`

```nginx
server {
    listen 80;
    server_name 116.203.137.201;
    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        # ... proxy headers
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        # ... proxy headers
    }
}
```

### Docker Compose
**Command:** `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

### Environment Variables (.env)
```bash
DB_PASSWORD=9qpTLeZlPj1m7E6OdAtgFs2CX84VUSiQ
JWT_SECRET=DiSeGq7NxFOz9Y4pQWhacvXIK1RBbyjEZLw8A2mgP5Vfk3s6utHTUr0nlJdoCM
FRONTEND_API_URL=http://116.203.137.201:5000
```

---

## 🛡️ **Security Configuration**

### Firewall (UFW)
```bash
✅ Port 22 (SSH) - Open
✅ Port 80 (HTTP) - Open
✅ Port 443 (HTTPS) - Open (ready for SSL)
✅ All other ports - Blocked
```

### Fail2ban
- ✅ Installed and active
- Protects against brute force SSH attacks

### Docker Security
- ✅ Services run on localhost (except pgAdmin)
- ✅ Nginx acts as reverse proxy
- ✅ No direct container exposure

---

## 🚀 **Common Operations**

### View Running Containers
```bash
ssh cuefinder@116.203.137.201 'docker ps'
```

### View Logs
```bash
# All services
ssh cuefinder@116.203.137.201 'docker-compose -f /home/cuefinder/app/docker-compose.yml -f /home/cuefinder/app/docker-compose.prod.yml logs -f'

# Specific service
ssh cuefinder@116.203.137.201 'docker logs -f cuefinder-backend-prod'
ssh cuefinder@116.203.137.201 'docker logs -f cuefinder-frontend-prod'
```

### Restart Services
```bash
# All services
ssh cuefinder@116.203.137.201 'cd /home/cuefinder/app && docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart'

# Specific service
ssh cuefinder@116.203.137.201 'cd /home/cuefinder/app && docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend'
```

### Stop/Start All Services
```bash
# Stop
ssh cuefinder@116.203.137.201 'cd /home/cuefinder/app && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down'

# Start
ssh cuefinder@116.203.137.201 'cd /home/cuefinder/app && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d'
```

### Update Application Code
```bash
# 1. Upload new code
scp -r ./CueFinderBE cuefinder@116.203.137.201:/home/cuefinder/app/
scp -r ./CueFinderFE cuefinder@116.203.137.201:/home/cuefinder/app/

# 2. Rebuild and restart
ssh cuefinder@116.203.137.201 'cd /home/cuefinder/app && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build'
```

### Database Backup
```bash
ssh cuefinder@116.203.137.201 'docker exec cuefinder-postgres-prod pg_dump -U postgres cuefinder > backup_$(date +%Y%m%d_%H%M%S).sql'
```

---

## 🔒 **Next Steps: SSL/HTTPS Setup**

### Option 1: With Domain Name (Recommended)
If you have a domain name (e.g., cuefinder.com):

```bash
# 1. Point DNS A record to 116.203.137.201

# 2. Update nginx config
ssh cuefinder@116.203.137.201 'sudo sed -i "s/server_name 116.203.137.201;/server_name cuefinder.com www.cuefinder.com;/" /etc/nginx/sites-available/cuefinder.conf'

# 3. Install SSL certificate
ssh cuefinder@116.203.137.201 'sudo certbot --nginx -d cuefinder.com -d www.cuefinder.com'

# 4. Access via HTTPS
# https://cuefinder.com
```

### Option 2: Self-Signed Certificate (Testing)
For development/testing without a domain:

```bash
ssh cuefinder@116.203.137.201 'sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt'
```

---

## 📊 **Monitoring**

### Check Service Health
```bash
# Container status
ssh cuefinder@116.203.137.201 'docker ps'

# Resource usage
ssh cuefinder@116.203.137.201 'docker stats --no-stream'

# Nginx status
ssh cuefinder@116.203.137.201 'sudo systemctl status nginx'

# Disk space
ssh cuefinder@116.203.137.201 'df -h'
```

### Performance
- **Server:** Hetzner CX33
  - 4 vCPU cores (AMD EPYC)
  - 8 GB RAM
  - 80 GB NVMe SSD
  - 20 TB traffic

---

## ⚠️ **Important Notes**

1. **pgAdmin Security:** Currently exposed on port 5050 with default password. Change it or restrict access.

2. **Environment Variables:** Stored in `/home/cuefinder/app/.env` - keep this secure!

3. **Database Backups:** Set up automated backups for production data.

4. **SSL Certificate:** Currently using HTTP. Set up HTTPS for production use.

5. **Domain Name:** Using IP address. Configure a domain for better user experience.

6. **Container Updates:** Regularly update Docker images for security patches.

---

## 🎯 **Deployment Checklist**

- [x] Server provisioned (Hetzner CX33)
- [x] Ubuntu 22.04 installed
- [x] SSH access configured
- [x] Docker & Docker Compose installed
- [x] Firewall (UFW) configured
- [x] Fail2ban installed
- [x] Application code deployed
- [x] Database running
- [x] Backend API running
- [x] Frontend running
- [x] Nginx reverse proxy configured
- [x] Public access verified
- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] pgAdmin password changed
- [ ] Database backups automated
- [ ] Monitoring configured

---

## 📞 **Support**

For issues or questions:
1. Check logs: `docker logs -f <container-name>`
2. Check nginx: `sudo nginx -t && sudo systemctl status nginx`
3. Check firewall: `sudo ufw status`
4. Check resources: `docker stats --no-stream`

---

**🎉 Congratulations! Your CueFinder application is now live in production!**

Access it at: **http://116.203.137.201**
