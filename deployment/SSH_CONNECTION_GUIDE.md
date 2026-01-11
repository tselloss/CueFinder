# SSH Connection Guide for CueFinder Hetzner Server

## Your SSH Setup ✅

- **Private Key:** `~/.ssh/cuefinder_hetzner` (keep this secure!)
- **Public Key:** `~/.ssh/cuefinder_hetzner.pub` (already added to cloud-init)
- **Username:** `cuefinder` (NOT root)

## How to Connect to Your Server

### 1. After your server is created (replace SERVER_IP with actual IP):

```powershell
ssh -i ~/.ssh/cuefinder_hetzner cuefinder@YOUR_SERVER_IP
```

### 2. If you want to make it easier, add to SSH config:

```powershell
# Edit SSH config
notepad ~/.ssh/config
```

Add this content:
```
Host cuefinder-prod
    HostName YOUR_SERVER_IP
    User cuefinder
    IdentityFile ~/.ssh/cuefinder_hetzner
    IdentitiesOnly yes
```

Then you can connect simply with:
```powershell
ssh cuefinder-prod
```

## Security Notes 🔒

1. **No passwords needed** - SSH keys are much more secure
2. **Keep your private key safe** - never share `cuefinder_hetzner` file
3. **Root login disabled** - you can only login as `cuefinder` user
4. **Sudo access** - use `sudo` for admin commands after login

## What Happens in Hetzner Cloud Console

1. Create server with Ubuntu 22.04 LTS
2. Paste the contents of `hetzner-cloud-init-ready.yaml` in the "Cloud config" section
3. Server will automatically:
   - Install Docker, Nginx, etc.
   - Create `cuefinder` user with your SSH key
   - Configure firewall (UFW)
   - Disable root/password login
   - Set up fail2ban for security

## First Login Test

After server creation, test connection:
```powershell
ssh -i ~/.ssh/cuefinder_hetzner cuefinder@YOUR_SERVER_IP

# You should see:
# Welcome to Ubuntu 22.04.3 LTS
# cuefinder@your-server:~$
```

## Troubleshooting

**"Permission denied (publickey)":**
- Check you're using the right key: `-i ~/.ssh/cuefinder_hetzner`
- Check you're using username `cuefinder`, not `root`
- Make sure server has finished cloud-init (wait 2-3 minutes after creation)

**"Connection refused":**
- Check server IP is correct
- Make sure firewall allows SSH from your IP (should be automatic)
- Server might still be booting (wait a few minutes)
