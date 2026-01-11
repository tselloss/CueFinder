# 🎱 billiardscuefinder.com - DNS Configuration Checklist

## ✅ What You Need To Do RIGHT NOW

### 1️⃣ Open Cloudflare Dashboard
**Go to:** https://dash.cloudflare.com

### 2️⃣ Select Your Domain
**Click on:** billiardscuefinder.com

### 3️⃣ Go to DNS Settings
**Click:** DNS (in the left sidebar)

### 4️⃣ Add DNS Records
**Click the blue "Add record" button**

---

## 📝 DNS Records to Add

### Record #1: Root Domain

```
Type:     A
Name:     @
IPv4:     116.203.137.201
Proxy:    🟠 Proxied (MUST be orange!)
TTL:      Auto
```

**Click "Save"**

---

### Record #2: WWW Subdomain

```
Type:     A
Name:     www
IPv4:     116.203.137.201
Proxy:    🟠 Proxied (MUST be orange!)
TTL:      Auto
```

**Click "Save"**

---

## 🔒 SSL Configuration

### 1. Click "SSL/TLS" in left sidebar

### 2. Set Encryption Mode
**Select:** Full (not Flexible, not Full Strict)

```
┌─────────────────────────────────────────────┐
│ ⚪ Off (not secure)                         │
│ ⚪ Flexible                                 │
│ 🔵 Full          ← SELECT THIS             │
│ ⚪ Full (strict)                            │
└─────────────────────────────────────────────┘
```

### 3. Click "Edge Certificates" tab

### 4. Turn ON These Settings:
- ☑️ **Always Use HTTPS** → ON
- ☑️ **Automatic HTTPS Rewrites** → ON
- Set **Minimum TLS Version** → 1.2

**Click "Save"**

---

## ⏱️ Wait 5-10 Minutes

DNS changes take time to propagate worldwide. This is normal!

### Test if DNS is ready:
```powershell
Resolve-DnsName -Name billiardscuefinder.com
```

---

## 🚀 Run Setup Script

After DNS is configured and propagated:

```powershell
cd C:\Users\karac\source\repos\CueFinder
.\deployment\setup-billiardscuefinder.ps1
```

---

## ✨ What You Get

After setup completes, you'll have:

✅ Custom domain (billiardscuefinder.com)  
✅ HTTPS/SSL encryption (free!)  
✅ DDoS protection (Cloudflare)  
✅ Global CDN (faster worldwide)  
✅ Automatic HTTPS redirect  
✅ WWW redirect  

---

## 📸 Visual Guide

### What the DNS page should look like:

```
┌──────────────────────────────────────────────────────────────┐
│ DNS Records                                    [Add record]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Type  Name  Content            Proxy  TTL                    │
│ ─────────────────────────────────────────────────────────   │
│ A     @     116.203.137.201    🟠     Auto     [Edit] [×]   │
│ A     www   116.203.137.201    🟠     Auto     [Edit] [×]   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### ⚠️ Common Mistakes:

❌ **Wrong:** Proxy is gray (DNS only)  
✅ **Correct:** Proxy is orange (Proxied)

❌ **Wrong:** Content is different IP  
✅ **Correct:** Content is 116.203.137.201

❌ **Wrong:** SSL mode is "Flexible"  
✅ **Correct:** SSL mode is "Full"

---

## 🆘 Need Help?

### DNS not propagating?
- Wait 10-15 minutes
- Check you clicked "Save"
- Verify orange cloud is ON

### Can't find SSL settings?
- Click "SSL/TLS" in left sidebar
- Make sure you're on the Overview tab

### Still stuck?
Run this to check DNS:
```powershell
nslookup billiardscuefinder.com
```

---

## 📞 Support

If you see errors when running the setup script, check:

1. **DNS is configured** - Both @ and www records
2. **Orange cloud is ON** - Must be proxied
3. **SSL mode is Full** - In SSL/TLS settings
4. **Waited 10 minutes** - DNS propagation time

---

## 🎯 Next Step

Once you've configured DNS in Cloudflare, run:

```powershell
.\deployment\setup-billiardscuefinder.ps1
```

This will automatically:
1. ✅ Verify DNS is working
2. ✅ Update Nginx on server
3. ✅ Install SSL certificate
4. ✅ Configure HTTPS redirect
5. ✅ Test the website

Your site will be live at: **https://billiardscuefinder.com** 🚀
