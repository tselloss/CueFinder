# 🎯 SIMPLE: 3 Steps to Get Your Domain Live

Your domain: **billiardscuefinder.com**  
Your server: **116.203.137.201**

---

## Step 1: Add DNS Records (2 minutes)

1. Go to https://dash.cloudflare.com
2. Click **billiardscuefinder.com**
3. Click **DNS** (left menu)
4. Click **Add record** button

**Add First Record:**
- Type: `A`
- Name: `@`
- IPv4 address: `116.203.137.201`
- Proxy status: **Click to make it ORANGE 🟠**
- Click **Save**

**Add Second Record:**
- Type: `A`
- Name: `www`
- IPv4 address: `116.203.137.201`
- Proxy status: **Click to make it ORANGE 🟠**
- Click **Save**

---

## Step 2: Set SSL Mode (1 minute)

1. Click **SSL/TLS** (left menu)
2. Click **Full** (the third option)
3. Click **Edge Certificates** tab at top
4. Turn ON the switch for **Always Use HTTPS**

---

## Step 3: Run Setup Script (2 minutes)

**Wait 5 minutes**, then open PowerShell and run:

```powershell
cd C:\Users\karac\source\repos\CueFinder
.\deployment\setup-billiardscuefinder.ps1
```

---

## ✅ Done!

Your site will be live at:
- https://billiardscuefinder.com
- https://www.billiardscuefinder.com

With:
- ✅ Free SSL certificate
- ✅ HTTPS encryption
- ✅ DDoS protection
- ✅ Global CDN (fast worldwide)

---

## 🆘 Troubleshooting

**"DNS not found"**
→ Wait 10 more minutes, DNS takes time

**Script fails**
→ Make sure both DNS records are added with orange cloud ON

**Site not loading**
→ Check SSL mode is set to "Full" (not Flexible)

---

## 📞 Quick Commands

**Check if DNS is ready:**
```powershell
Resolve-DnsName billiardscuefinder.com
```

**Check website status:**
```powershell
curl.exe -I https://billiardscuefinder.com
```

**View server logs:**
```powershell
ssh cuefinder@116.203.137.201 'docker logs -f cuefinder-backend-prod'
```

---

That's it! Follow these 3 steps and your professional billiard cue marketplace will be live! 🎱
