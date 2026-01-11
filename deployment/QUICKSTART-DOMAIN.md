# 🎱 Quick Start: Configure billiardscuefinder.com

## ⚡ 5-Minute Setup

Your domain: **billiardscuefinder.com**  
Your server: **116.203.137.201**

---

## Step 1️⃣: Configure DNS in Cloudflare (2 minutes)

1. **Go to:** https://dash.cloudflare.com
2. **Click:** billiardscuefinder.com
3. **Click:** DNS (left sidebar)
4. **Add these 2 records:**

### Record 1: Root Domain
```
┌─────────────────────────────────────────┐
│ Type:    A                              │
│ Name:    @                              │
│ Content: 116.203.137.201                │
│ Proxy:   ✅ Proxied (🟠 Orange Cloud)  │
│ TTL:     Auto                           │
└─────────────────────────────────────────┘
```

### Record 2: WWW Subdomain
```
┌─────────────────────────────────────────┐
│ Type:    A                              │
│ Name:    www                            │
│ Content: 116.203.137.201                │
│ Proxy:   ✅ Proxied (🟠 Orange Cloud)  │
│ TTL:     Auto                           │
└─────────────────────────────────────────┘
```

**✨ Important:** Make sure the cloud icon is **ORANGE** (Proxied), not gray!

**Click:** Save

---

## Step 2️⃣: Configure SSL in Cloudflare (1 minute)

1. **Click:** SSL/TLS (left sidebar)
2. **Set encryption mode to:** **Full**
   ```
   Your SSL/TLS encryption mode is Full
   ✓ Encrypts traffic between Cloudflare and your server
   ```

3. **Click:** Edge Certificates (sub-tab)
4. **Turn ON these settings:**
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Minimum TLS Version: 1.2

**Click:** Save

---

## Step 3️⃣: Wait 5-10 Minutes ⏱️

DNS propagation takes a few minutes. Grab a coffee ☕

**Test if DNS is ready:**
```powershell
Resolve-DnsName -Name billiardscuefinder.com
```

---

## Step 4️⃣: Run Automated Setup (2 minutes)

Open PowerShell in your project folder:

```powershell
cd C:\Users\karac\source\repos\CueFinder

# Run the setup script
.\deployment\setup-billiardscuefinder.ps1
```

This script will:
- ✅ Verify DNS configuration
- ✅ Update Nginx on server
- ✅ Install SSL certificate
- ✅ Update app configuration
- ✅ Test the website

---

## Step 5️⃣: Test Your Website! 🎉

Open in browser:
- **https://billiardscuefinder.com** 🚀
- **https://www.billiardscuefinder.com** 🚀

Look for the **🔒 padlock icon** in the address bar = secure!

---

## 📋 Visual DNS Configuration

### Before (Wrong ❌):
```
Type  Name  Content            Proxy
A     @     116.203.137.201    ⚪ DNS only (gray)  ❌
```

### After (Correct ✅):
```
Type  Name  Content            Proxy
A     @     116.203.137.201    🟠 Proxied (orange) ✅
A     www   116.203.137.201    🟠 Proxied (orange) ✅
```

---

## 🎯 What You Get

✅ **Free SSL Certificate** - Automatic HTTPS  
✅ **DDoS Protection** - Protected against attacks  
✅ **Global CDN** - Fast loading worldwide  
✅ **Always Online** - Cached version if server down  
✅ **Web Application Firewall** - Security rules  
✅ **Bot Protection** - Block malicious bots  
✅ **Analytics** - Traffic insights  

---

## 🐛 Troubleshooting

### "DNS not found"
**Solution:** Wait 5-10 more minutes, DNS takes time to propagate

### "Site can't be reached"
**Solution:** 
1. Check DNS records in Cloudflare
2. Make sure orange cloud is ON (Proxied)
3. Wait a bit longer

### "Too many redirects"
**Solution:**
1. Go to Cloudflare → SSL/TLS
2. Change mode from "Flexible" to "Full"

### "Error 521"
**Solution:**
```powershell
# Check if server is running
ssh cuefinder@116.203.137.201 'docker ps'
ssh cuefinder@116.203.137.201 'sudo systemctl status nginx'
```

---

## 📞 Need Help?

**Check the detailed guides:**
- `deployment/cloudflare-setup-guide.md` - Full Cloudflare guide
- `docs/DOMAIN_SETUP_GUIDE.md` - Complete domain setup guide

**Check application status:**
```powershell
ssh cuefinder@116.203.137.201 'docker ps'
```

**View logs:**
```powershell
ssh cuefinder@116.203.137.201 'docker logs cuefinder-backend-prod'
```

---

## ✨ That's It!

Your billiard cue marketplace is now live on a professional domain with:
- ✅ HTTPS/SSL security
- ✅ DDoS protection
- ✅ Global CDN
- ✅ Professional email addresses (setup in Cloudflare Email Routing)

**Visit your site:** https://billiardscuefinder.com 🎱

---

## 🎨 Bonus: Professional Email Setup

Want `admin@billiardscuefinder.com` to forward to your Gmail?

1. **Go to:** Cloudflare Dashboard → Email → Email Routing
2. **Click:** Enable Email Routing
3. **Add destination:** vagelis95@hotmail.com (verify it)
4. **Create addresses:**
   - `admin@billiardscuefinder.com` → vagelis95@hotmail.com
   - `support@billiardscuefinder.com` → vagelis95@hotmail.com
   - `info@billiardscuefinder.com` → vagelis95@hotmail.com

Now you can use professional emails for free! 📧
