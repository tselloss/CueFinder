# 🌐 Domain Name Setup Guide for CueFinder

## Overview

This guide will help you configure a custom domain name (e.g., `cuefinder.com`) instead of using the IP address (`116.203.137.201`).

---

## 📋 Prerequisites

- A registered domain name (from registrars like GoDaddy, Namecheap, Google Domains, Cloudflare, etc.)
- Access to your domain's DNS settings
- Server IP: `116.203.137.201`

---

## 🎯 Step-by-Step Setup

### Step 1: Configure DNS Records

You need to point your domain to your Hetzner server's IP address.

#### Option A: Using Domain Registrar's DNS

1. **Log into your domain registrar** (GoDaddy, Namecheap, etc.)

2. **Find DNS Management/Settings**
   - Usually under "DNS Settings", "DNS Management", or "Nameservers"

3. **Add/Edit DNS Records:**

   **For root domain (cuefinder.com):**
   ```
   Type: A
   Name: @ (or leave blank)
   Value: 116.203.137.201
   TTL: 3600 (or Auto)
   ```

   **For www subdomain (www.cuefinder.com):**
   ```
   Type: A
   Name: www
   Value: 116.203.137.201
   TTL: 3600 (or Auto)
   ```

   **Alternative: Use CNAME for www:**
   ```
   Type: CNAME
   Name: www
   Value: cuefinder.com (or @)
   TTL: 3600
   ```

4. **Save Changes**
   - DNS propagation takes 5-60 minutes (can be up to 48 hours)

#### Option B: Using Cloudflare DNS (Recommended for Free SSL)

1. **Sign up at cloudflare.com**

2. **Add your domain** to Cloudflare

3. **Update nameservers** at your registrar to Cloudflare's nameservers
   - Example: `ns1.cloudflare.com`, `ns2.cloudflare.com`

4. **In Cloudflare DNS settings, add:**
   ```
   Type: A
   Name: @ (or cuefinder.com)
   IPv4: 116.203.137.201
   Proxy status: Proxied (orange cloud) ← Enables Cloudflare SSL
   ```

   ```
   Type: A
   Name: www
   IPv4: 116.203.137.201
   Proxy status: Proxied (orange cloud)
   ```

---

### Step 2: Verify DNS Propagation

Wait 5-10 minutes, then check if your domain resolves:

**Windows PowerShell:**
```powershell
# Check if domain points to your server
Resolve-DnsName -Name cuefinder.com

# Or use nslookup
nslookup cuefinder.com

# Should return: 116.203.137.201
```

**Alternative: Online Tools**
- https://dnschecker.org
- https://www.whatsmydns.net

Look for your domain and verify it resolves to `116.203.137.201` globally.

---

### Step 3: Update Nginx Configuration

Once DNS is propagated, update your server configuration:

**Option A: Automated (Use the SSL Setup Script)**
```powershell
# From your local machine
cd C:\Users\karac\source\repos\CueFinder
.\deployment\setup-ssl.ps1 -Domain "cuefinder.com" -Email "your-email@example.com"
```

This script will:
- ✅ Update Nginx to use your domain
- ✅ Install free Let's Encrypt SSL certificate
- ✅ Configure automatic HTTPS redirect
- ✅ Set up auto-renewal

**Option B: Manual Configuration**

1. **Update Nginx config:**
```powershell
ssh cuefinder@116.203.137.201
```

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/cuefinder.conf
```

Change this line:
```nginx
server_name 116.203.137.201;
```

To:
```nginx
server_name cuefinder.com www.cuefinder.com;
```

2. **Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

3. **Test HTTP access:**
```bash
curl -I http://cuefinder.com
```

---

### Step 4: Install SSL Certificate (HTTPS)

**Automated Installation:**

```bash
# On server (already SSH'd in)
sudo certbot --nginx -d cuefinder.com -d www.cuefinder.com --non-interactive --agree-tos --email your-email@example.com --redirect
```

**What this does:**
- ✅ Obtains free SSL certificate from Let's Encrypt
- ✅ Automatically configures Nginx for HTTPS
- ✅ Sets up HTTP → HTTPS redirect
- ✅ Configures auto-renewal (runs twice daily)

**Manual SSL Configuration (if needed):**

```bash
# Install certificate
sudo certbot certonly --nginx -d cuefinder.com -d www.cuefinder.com

# Edit nginx config
sudo nano /etc/nginx/sites-available/cuefinder.conf
```

Add SSL configuration:
```nginx
server {
    listen 80;
    server_name cuefinder.com www.cuefinder.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cuefinder.com www.cuefinder.com;

    ssl_certificate /etc/letsencrypt/live/cuefinder.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cuefinder.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend auth endpoints
    location ~ ^/(auth|connect|swagger) {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Step 5: Update Application Configuration

**Update Frontend API URL:**

1. **In your local code**, edit `.env` or frontend config:
```bash
REACT_APP_API_URL=https://cuefinder.com/api
```

2. **Update server .env:**
```bash
ssh cuefinder@116.203.137.201
nano /home/cuefinder/app/.env
```

Change:
```bash
FRONTEND_API_URL=https://cuefinder.com
```

3. **Rebuild frontend if needed:**
```bash
cd /home/cuefinder/app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

**Update Backend CORS settings** (if needed):

Edit `CueFinderBE/Program.cs` to allow your domain:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://cuefinder.com",
            "https://www.cuefinder.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

---

### Step 6: Verify Everything Works

**Test HTTPS:**
```powershell
curl.exe -I https://cuefinder.com
```

Should return: `HTTP/2 200` (or `HTTP/1.1 200`)

**Test HTTP → HTTPS redirect:**
```powershell
curl.exe -I http://cuefinder.com
```

Should return: `HTTP/1.1 301 Moved Permanently` with `Location: https://cuefinder.com`

**Visit in browser:**
- https://cuefinder.com ✅
- https://www.cuefinder.com ✅
- Both should work and show a padlock 🔒 icon

---

## 🌍 Popular Domain Registrars & Their DNS Settings

### GoDaddy
1. Log in → My Products → Domain → DNS
2. Add Record → Type: A → Name: @ → Value: 116.203.137.201
3. Add Record → Type: A → Name: www → Value: 116.203.137.201

### Namecheap
1. Domain List → Manage → Advanced DNS
2. Add New Record → A Record → Host: @ → Value: 116.203.137.201
3. Add New Record → A Record → Host: www → Value: 116.203.137.201

### Google Domains
1. My Domains → DNS → Manage Custom Records
2. Create Record → Type: A → Name: @ → Data: 116.203.137.201
3. Create Record → Type: A → Name: www → Data: 116.203.137.201

### Cloudflare (Recommended)
1. DNS → Add Record
2. Type: A, Name: @, IPv4: 116.203.137.201, Proxy status: Proxied
3. Type: A, Name: www, IPv4: 116.203.137.201, Proxy status: Proxied

### AWS Route 53
1. Hosted Zones → Create Record Set
2. Name: leave blank, Type: A, Value: 116.203.137.201
3. Name: www, Type: A, Value: 116.203.137.201

---

## 🔄 Certificate Auto-Renewal

Let's Encrypt certificates expire after 90 days, but Certbot automatically renews them.

**Check renewal status:**
```bash
ssh cuefinder@116.203.137.201 'sudo certbot renew --dry-run'
```

**Check certbot timer:**
```bash
ssh cuefinder@116.203.137.201 'sudo systemctl status certbot.timer'
```

**Manual renewal (if needed):**
```bash
ssh cuefinder@116.203.137.201 'sudo certbot renew'
```

---

## 🎨 Complete Example Setup

Let's say you own **cuefinder.com**:

### 1. Configure DNS (at your registrar):
```
A Record:  @    → 116.203.137.201
A Record:  www  → 116.203.137.201
```

### 2. Wait for DNS propagation (5-10 minutes)

### 3. Run SSL setup script (from your PC):
```powershell
cd C:\Users\karac\source\repos\CueFinder
.\deployment\setup-ssl.ps1 -Domain "cuefinder.com" -Email "admin@cuefinder.com"
```

### 4. Done! Access your site:
- ✅ https://cuefinder.com
- ✅ https://www.cuefinder.com
- ✅ http://cuefinder.com (redirects to HTTPS)

---

## 🐛 Troubleshooting

### DNS not propagating
- **Wait 10-30 minutes** - DNS can be slow
- Check with: `nslookup cuefinder.com`
- Verify at: https://dnschecker.org

### Certbot fails with "DNS not pointing to server"
- Ensure DNS A record points to `116.203.137.201`
- Wait longer for DNS propagation
- Check port 80 is open: `sudo ufw status`

### "Rate limit" error from Let's Encrypt
- Let's Encrypt allows 5 certificates per domain per week
- Wait a few hours or try tomorrow
- Use staging environment: `certbot --staging ...`

### HTTPS works but shows "Not Secure"
- Mixed content issue (loading HTTP resources on HTTPS page)
- Update all API URLs in frontend to use `https://`
- Check browser console for errors

### www doesn't work
- Add www A record in DNS
- Include www in certbot: `-d cuefinder.com -d www.cuefinder.com`
- Update nginx server_name to include both

---

## 📚 Additional Resources

- **Let's Encrypt:** https://letsencrypt.org
- **Certbot Documentation:** https://certbot.eff.org
- **DNS Checker:** https://dnschecker.org
- **SSL Labs Test:** https://www.ssllabs.com/ssltest/

---

## 🚀 Quick Command Reference

```powershell
# Check DNS
Resolve-DnsName -Name cuefinder.com

# Setup SSL (automated)
.\deployment\setup-ssl.ps1 -Domain "cuefinder.com" -Email "admin@cuefinder.com"

# Manual SSL install
ssh cuefinder@116.203.137.201 'sudo certbot --nginx -d cuefinder.com -d www.cuefinder.com'

# Check certificate status
ssh cuefinder@116.203.137.201 'sudo certbot certificates'

# Test certificate renewal
ssh cuefinder@116.203.137.201 'sudo certbot renew --dry-run'

# Reload nginx
ssh cuefinder@116.203.137.201 'sudo systemctl reload nginx'
```

---

**Need help?** Check the logs:
```bash
ssh cuefinder@116.203.137.201 'sudo tail -f /var/log/nginx/error.log'
```
