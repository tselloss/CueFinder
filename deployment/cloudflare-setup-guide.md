# 🌐 Cloudflare Setup Guide for billiardscuefinder.com

## ✅ Domain Registered Successfully!

**Domain:** billiardscuefinder.com  
**Registrar:** Cloudflare  
**Server IP:** 116.203.137.201  
**Expires:** Jan 10, 2027 (Auto-renew enabled)

---

## 📋 Quick Setup Steps

### Step 1: Configure DNS Records in Cloudflare

1. **Go to Cloudflare Dashboard:** https://dash.cloudflare.com
2. **Select your domain:** billiardscuefinder.com
3. **Click "DNS" in the left sidebar**

#### Add These DNS Records:

**Root Domain (billiardscuefinder.com):**
```
Type:    A
Name:    @ (or billiardscuefinder.com)
Content: 116.203.137.201
Proxy:   ✅ Proxied (Orange Cloud) ← IMPORTANT!
TTL:     Auto
```

**WWW Subdomain (www.billiardscuefinder.com):**
```
Type:    A
Name:    www
Content: 116.203.137.201
Proxy:   ✅ Proxied (Orange Cloud) ← IMPORTANT!
TTL:     Auto
```

**Why Orange Cloud (Proxied)?**
- ✅ Free Cloudflare SSL certificate (automatic HTTPS)
- ✅ DDoS protection
- ✅ CDN (faster loading worldwide)
- ✅ Caching
- ✅ Web Application Firewall (WAF)

---

### Step 2: Configure Cloudflare SSL Settings

1. **Go to SSL/TLS section** in Cloudflare Dashboard
2. **Set SSL/TLS encryption mode to "Full"** (NOT "Full (strict)" initially)
   - This allows Cloudflare to encrypt traffic even though your server uses HTTP internally

**Settings to Configure:**

**SSL/TLS → Overview:**
```
Encryption mode: Full
```

**SSL/TLS → Edge Certificates:**
```
✅ Always Use HTTPS: ON
✅ HTTP Strict Transport Security (HSTS): Enable (optional, but recommended)
✅ Minimum TLS Version: 1.2
✅ Automatic HTTPS Rewrites: ON
```

---

### Step 3: Update Your Server Configuration

Now update your Hetzner server to use the domain name:

**Option A: Automated Setup (Recommended)**

```powershell
# From your PC, run:
cd C:\Users\karac\source\repos\CueFinder

# Run the SSL setup script
.\deployment\setup-ssl.ps1 -Domain "billiardscuefinder.com" -Email "vagelis95@hotmail.com"
```

**Option B: Manual Setup**

```powershell
# SSH into server
ssh cuefinder@116.203.137.201

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/cuefinder.conf
```

Change this line:
```nginx
server_name 116.203.137.201;
```

To:
```nginx
server_name billiardscuefinder.com www.billiardscuefinder.com;
```

Save and test:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 4: Install Let's Encrypt SSL on Server (Cloudflare Origin Certificate)

Even though Cloudflare provides SSL to visitors, you should also secure the connection between Cloudflare and your server:

```bash
# SSH to server
ssh cuefinder@116.203.137.201

# Install SSL certificate
sudo certbot --nginx -d billiardscuefinder.com -d www.billiardscuefinder.com --email vagelis95@hotmail.com --agree-tos --non-interactive --redirect
```

**After this, go back to Cloudflare and change SSL mode:**
```
SSL/TLS → Overview → Encryption mode: Full (strict)
```

This ensures end-to-end encryption.

---

### Step 5: Configure Cloudflare Speed & Security Settings

#### **Speed → Optimization**
```
✅ Auto Minify: Check HTML, CSS, JavaScript
✅ Brotli: ON
✅ Early Hints: ON
✅ Rocket Loader: ON (optional, test if it breaks your app)
```

#### **Caching → Configuration**
```
Caching Level: Standard
Browser Cache TTL: 4 hours (or longer)
✅ Always Online: ON
```

#### **Security → Settings**
```
Security Level: Medium (or High if getting attacked)
✅ Bot Fight Mode: ON (free DDoS protection)
✅ Challenge Passage: 30 minutes
```

#### **Firewall**
- Create rules to block bad traffic (optional)
- Enable "I'm Under Attack Mode" if experiencing DDoS

---

### Step 6: Configure Page Rules (Optional but Recommended)

Create page rules to optimize caching:

**Rule 1: Cache Static Assets**
```
URL: billiardscuefinder.com/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

**Rule 2: Don't Cache API**
```
URL: billiardscuefinder.com/api/*
Settings:
  - Cache Level: Bypass
```

**Rule 3: Redirect WWW to Non-WWW (or vice versa)**
```
URL: www.billiardscuefinder.com/*
Settings:
  - Forwarding URL: 301 Permanent Redirect
  - Destination: https://billiardscuefinder.com/$1
```

---

### Step 7: Update Application Configuration

**Update Frontend Environment Variables:**

On your server:
```bash
ssh cuefinder@116.203.137.201
nano /home/cuefinder/app/.env
```

Change:
```bash
FRONTEND_API_URL=https://billiardscuefinder.com
```

**Update Frontend Build (if API URL is hardcoded):**

If your React app has the API URL in the code, rebuild:
```bash
cd /home/cuefinder/app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

**Update Backend CORS (if needed):**

Edit `CueFinderBE/Program.cs` locally:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://billiardscuefinder.com",
            "https://www.billiardscuefinder.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

Then redeploy backend.

---

### Step 8: Test Everything

**Check DNS Propagation:**
```powershell
# From your PC
Resolve-DnsName -Name billiardscuefinder.com
```

Should show Cloudflare IPs (not your server IP directly).

**Test HTTPS:**
```powershell
curl.exe -I https://billiardscuefinder.com
```

Should return: `HTTP/2 200`

**Test in Browser:**
1. Visit: https://billiardscuefinder.com ✅
2. Visit: https://www.billiardscuefinder.com ✅
3. Visit: http://billiardscuefinder.com (should redirect to HTTPS) ✅
4. Check for padlock 🔒 icon in browser

---

## 🎯 Complete Automated Setup Script

I'll create a script specifically for your domain:

```powershell
# Save this as: setup-billiardscuefinder.ps1

Write-Host "🌐 Setting up billiardscuefinder.com" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Step 1: Check DNS
Write-Host "`n1. Checking DNS configuration..." -ForegroundColor Yellow
$dns = Resolve-DnsName -Name billiardscuefinder.com -ErrorAction SilentlyContinue
if ($dns) {
    Write-Host "✓ DNS is configured!" -ForegroundColor Green
    Write-Host "   Resolves to: $($dns[0].IPAddress)" -ForegroundColor Gray
} else {
    Write-Host "✗ DNS not yet propagated. Please wait 5-10 minutes." -ForegroundColor Red
    exit 1
}

# Step 2: Update Nginx
Write-Host "`n2. Updating Nginx configuration..." -ForegroundColor Yellow
ssh cuefinder@116.203.137.201 @"
sudo sed -i 's/server_name .*/server_name billiardscuefinder.com www.billiardscuefinder.com;/' /etc/nginx/sites-available/cuefinder.conf
sudo nginx -t && sudo systemctl reload nginx
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Nginx updated successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to update Nginx" -ForegroundColor Red
    exit 1
}

# Step 3: Install SSL
Write-Host "`n3. Installing SSL certificate..." -ForegroundColor Yellow
ssh cuefinder@116.203.137.201 @"
sudo certbot --nginx -d billiardscuefinder.com -d www.billiardscuefinder.com --email vagelis95@hotmail.com --agree-tos --non-interactive --redirect
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSL certificate installed!" -ForegroundColor Green
} else {
    Write-Host "⚠ SSL installation had issues (this is OK if using Cloudflare proxy)" -ForegroundColor Yellow
}

# Step 4: Update application .env
Write-Host "`n4. Updating application configuration..." -ForegroundColor Yellow
ssh cuefinder@116.203.137.201 @"
sed -i 's|FRONTEND_API_URL=.*|FRONTEND_API_URL=https://billiardscuefinder.com|' /home/cuefinder/app/.env
"@

Write-Host "✓ Configuration updated!" -ForegroundColor Green

# Step 5: Test
Write-Host "`n5. Testing website..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$test = curl.exe -I https://billiardscuefinder.com 2>&1 | Select-String "200"
if ($test) {
    Write-Host "✓ Website is accessible!" -ForegroundColor Green
} else {
    Write-Host "⚠ Website test inconclusive" -ForegroundColor Yellow
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "`nYour site is now live at:" -ForegroundColor White
Write-Host "  🌐 https://billiardscuefinder.com" -ForegroundColor Cyan
Write-Host "  🌐 https://www.billiardscuefinder.com" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Test your website in a browser" -ForegroundColor White
Write-Host "  2. Configure Cloudflare caching (optional)" -ForegroundColor White
Write-Host "  3. Set up Cloudflare analytics" -ForegroundColor White
Write-Host "  4. Change SSL mode to 'Full (strict)' in Cloudflare" -ForegroundColor White
```

---

## 🔧 Cloudflare Dashboard Checklist

Go through these settings in your Cloudflare Dashboard:

### DNS ✅
- [ ] A record for @ pointing to 116.203.137.201 (Proxied)
- [ ] A record for www pointing to 116.203.137.201 (Proxied)

### SSL/TLS ✅
- [ ] Encryption mode: Full (or Full (strict) after certbot)
- [ ] Always Use HTTPS: ON
- [ ] Automatic HTTPS Rewrites: ON
- [ ] Minimum TLS Version: TLS 1.2

### Speed ✅
- [ ] Auto Minify: HTML, CSS, JS enabled
- [ ] Brotli: ON
- [ ] Early Hints: ON

### Caching ✅
- [ ] Caching Level: Standard
- [ ] Browser Cache TTL: 4 hours or more
- [ ] Always Online: ON

### Security ✅
- [ ] Security Level: Medium
- [ ] Bot Fight Mode: ON
- [ ] Challenge Passage: 30 minutes

### Firewall (Optional) 🛡️
- [ ] Create rule to block bad bots
- [ ] Create rule to allow only certain countries (if applicable)

---

## 🚀 Benefits of Cloudflare

With your domain on Cloudflare, you get:

✅ **Free SSL Certificate** - Automatic HTTPS  
✅ **DDoS Protection** - Protection against attacks  
✅ **Global CDN** - Fast loading worldwide  
✅ **Caching** - Reduced server load  
✅ **Web Application Firewall** - Security rules  
✅ **Analytics** - Traffic insights  
✅ **Always Online** - Serves cached version if server down  
✅ **Bot Protection** - Blocks malicious bots  
✅ **Email Routing** - Free email forwarding (e.g., admin@billiardscuefinder.com → vagelis95@hotmail.com)

---

## 📧 Set Up Email Forwarding (Bonus)

You can create professional email addresses:

1. Go to **Email → Email Routing** in Cloudflare
2. Enable Email Routing
3. Create addresses like:
   - `admin@billiardscuefinder.com` → `vagelis95@hotmail.com`
   - `support@billiardscuefinder.com` → `vagelis95@hotmail.com`
   - `info@billiardscuefinder.com` → `vagelis95@hotmail.com`

---

## 🐛 Troubleshooting

### "Site Can't Be Reached"
- Wait 5-10 minutes for DNS propagation
- Check DNS records in Cloudflare Dashboard
- Verify orange cloud is enabled (Proxied)

### "SSL Error" or "Too Many Redirects"
- Change Cloudflare SSL mode from "Flexible" to "Full"
- Ensure Nginx has SSL certificate installed

### Cloudflare Shows "Error 521"
- Your server is down or firewall is blocking Cloudflare IPs
- Check: `ssh cuefinder@116.203.137.201 'docker ps'`
- Check: `ssh cuefinder@116.203.137.201 'sudo systemctl status nginx'`

### Cloudflare Shows "Error 525"
- SSL handshake failed between Cloudflare and your server
- Run: `sudo certbot --nginx -d billiardscuefinder.com -d www.billiardscuefinder.com`

---

## 📱 Next Steps

1. **Configure DNS now** (takes 2 minutes)
2. **Run the automated setup script** (takes 5 minutes)
3. **Test your website** at https://billiardscuefinder.com
4. **Configure Cloudflare settings** (optimize speed & security)
5. **Set up email forwarding** (optional but professional)

---

**Your domain is registered and ready! Let's configure it now! 🚀**
