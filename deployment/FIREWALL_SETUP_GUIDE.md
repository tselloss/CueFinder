# 🔥 Hetzner Firewall Configuration Guide

## Your IP Address: **94.70.71.16**

---

## 📋 Step-by-Step: Creating Firewall in Hetzner Console

### Step 1: Navigate to Firewalls
1. Go to: https://console.hetzner.cloud/
2. Select your project
3. Click **"Firewalls"** in the left sidebar (🔥 icon)
4. Click **"Create Firewall"** button (top right)

---

### Step 2: Configure Firewall

#### Basic Settings
```
Name: cuefinder-firewall
Description: Firewall for CueFinder production server
```

#### Inbound Rules (Click "+ Add rule" for each)

**Rule 1: SSH (Secure - Your PC Only)**
```
Direction: Inbound
Protocol: TCP
Port: 22
Source: 94.70.71.16/32
Description: SSH from my PC
```

**Rule 2: HTTP (Public Web Traffic)**
```
Direction: Inbound
Protocol: TCP
Port: 80
Source: 0.0.0.0/0
Source IPv6: ::/0
Description: HTTP web traffic
```

**Rule 3: HTTPS (Secure Web Traffic)**
```
Direction: Inbound
Protocol: TCP
Port: 443
Source: 0.0.0.0/0
Source IPv6: ::/0
Description: HTTPS secure web traffic
```

#### Outbound Rules
```
Leave default: Allow all outbound traffic
```

---

### Step 3: Save and Apply

1. Click **"Create Firewall"**
2. Firewall is now created but NOT active yet
3. To apply: 
   - **Option A:** Select it when creating your server
   - **Option B:** Go to existing server → Firewalls tab → Add firewall

---

## 🎯 Visual Configuration Reference

### In Hetzner Console, Fill Like This:

```
┌────────────────────────────────────────────────────────┐
│  Create Firewall                                       │
├────────────────────────────────────────────────────────┤
│  Name: cuefinder-firewall                              │
│  Labels: [optional]                                    │
│                                                        │
│  ┌──────────── Inbound Rules ─────────────┐           │
│  │                                         │           │
│  │  Rule 1                                 │           │
│  │  Protocol: TCP ▼                        │           │
│  │  Port: 22                               │           │
│  │  Source IPs: 94.70.71.16/32            │           │
│  │  [Delete]                               │           │
│  │                                         │           │
│  │  Rule 2                                 │           │
│  │  Protocol: TCP ▼                        │           │
│  │  Port: 80                               │           │
│  │  Source IPs: 0.0.0.0/0, ::/0           │           │
│  │  [Delete]                               │           │
│  │                                         │           │
│  │  Rule 3                                 │           │
│  │  Protocol: TCP ▼                        │           │
│  │  Port: 443                              │           │
│  │  Source IPs: 0.0.0.0/0, ::/0           │           │
│  │  [Delete]                               │           │
│  │                                         │           │
│  │  [+ Add rule]                           │           │
│  └─────────────────────────────────────────┘           │
│                                                        │
│  ┌──────────── Outbound Rules ────────────┐           │
│  │                                         │           │
│  │  ✓ Allow all outbound traffic          │           │
│  │                                         │           │
│  └─────────────────────────────────────────┘           │
│                                                        │
│  [Cancel]                    [Create Firewall]        │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 If Your IP Changes

### Check Your Current IP:
```powershell
Invoke-RestMethod -Uri "https://api.ipify.org?format=json"
```

### Update Firewall in Hetzner:
1. Go to **Firewalls** → `cuefinder-firewall`
2. Click **Edit** on Rule 1 (SSH)
3. Change Source IP from `94.70.71.16/32` to `NEW_IP/32`
4. Click **Save**

### Or Update on Server:
```bash
# SSH into server first
ssh cuefinder@YOUR_SERVER_IP

# Run the helper script
./update-ssh-ip.sh NEW_IP_ADDRESS
```

---

## ⚙️ Alternative: Less Restrictive (Not Recommended for Production)

If you have a **dynamic IP** that changes frequently:

### Option 1: Allow Your ISP's IP Range
```
Instead of: 94.70.71.16/32
Use: 94.70.0.0/16 (entire range)

Check your range: https://ipinfo.io/94.70.71.16
```

### Option 2: Allow SSH from Anywhere (Use with Fail2ban)
```
Source: 0.0.0.0/0, ::/0
Description: SSH protected by fail2ban

⚠️ Only do this if fail2ban is configured!
(Already in cloud-init script)
```

---

## 🛡️ Security Comparison

### Maximum Security (Recommended):
```
SSH: 94.70.71.16/32 ← Your IP only
+ Fail2ban active
+ SSH keys only (no passwords)
+ Strong firewall rules
= Nearly impossible to breach
```

### Balanced Security:
```
SSH: 94.70.0.0/16 ← Your ISP range
+ Fail2ban active
+ SSH keys only
= Good security, easier management
```

### Minimum Security (Not Recommended):
```
SSH: 0.0.0.0/0 ← Anywhere
+ Fail2ban active (REQUIRED!)
+ SSH keys only
= Acceptable only with fail2ban
```

---

## 📊 Firewall Rules Summary Table

| Service | Port | Protocol | Source         | Purpose              |
|---------|------|----------|----------------|----------------------|
| SSH     | 22   | TCP      | 94.70.71.16/32 | Admin access         |
| HTTP    | 80   | TCP      | 0.0.0.0/0, ::/0| Web traffic          |
| HTTPS   | 443  | TCP      | 0.0.0.0/0, ::/0| Secure web traffic   |

---

## ✅ Verification After Setup

### Test Firewall:
```powershell
# From your PC - Should work
ssh cuefinder@YOUR_SERVER_IP

# From another network - Should fail (timeout)
```

### On Server:
```bash
# Check UFW status
sudo ufw status numbered

# Should show:
# [1] 22/tcp    ALLOW IN    94.70.71.16
# [2] 80/tcp    ALLOW IN    Anywhere
# [3] 443/tcp   ALLOW IN    Anywhere
```

---

## 🆘 Troubleshooting

### Can't SSH to Server:

**Check 1: Verify Your IP**
```powershell
Invoke-RestMethod -Uri "https://api.ipify.org?format=json"
```

**Check 2: Verify Firewall Rule in Hetzner**
- Go to Firewalls
- Check if `94.70.71.16/32` is in Rule 1

**Check 3: Try from Different Network**
- Use mobile hotspot
- Use VPN
- If works from other IP, your IP changed

**Emergency Access:**
- Go to Hetzner Console
- Select server
- Click "Console" button (top right)
- Access via web console
- Update firewall: `sudo ufw allow 22/tcp`

---

## 📱 Quick Commands

### Check Your IP:
```powershell
Invoke-RestMethod -Uri "https://api.ipify.org?format=json"
```

### SSH to Server:
```powershell
ssh cuefinder@YOUR_SERVER_IP
```

### Check Firewall on Server:
```bash
sudo ufw status verbose
```

### Temporarily Allow All SSH (Emergency):
```bash
sudo ufw allow 22/tcp
# Later remove: sudo ufw delete allow 22/tcp
```

---

## 🎯 Ready to Deploy?

1. ✅ **Your IP:** 94.70.71.16
2. ✅ **Firewall rules:** Defined above
3. ✅ **Cloud-init:** `deployment/hetzner-cloud-init-secure.yaml`
4. ✅ **Create server** in Hetzner console
5. ✅ **Apply firewall** during server creation

**Next:** Follow `DEPLOYMENT_QUICKSTART.md` for full deployment!

---

## 💡 Pro Tip

Save this IP address info:
```
My Public IP: 94.70.71.16
Date: January 10, 2026
Location: Greece (based on IP)
ISP: Check at https://ipinfo.io/94.70.71.16

If IP changes, update firewall immediately!
```
