# 🔐 SSL Setup Guide for CueFinder

## Quick Start (Production - Let's Encrypt)

SSH into your server and run:

```bash
ssh cuefinder@116.203.137.201
cd /home/cuefinder/app
bash deployment/setup-ssl-letsencrypt.sh
```

This will:
- Install certbot
- Obtain free SSL certificates from Let's Encrypt
- Configure nginx to use HTTPS
- Set up automatic certificate renewal
- Restart containers with SSL enabled

**Requirements:**
- Domain must point to your server (A record: billiardscuefinder.com → 116.203.137.201)
- Port 80 must be accessible (for certificate validation)

---

## Alternative: Self-Signed Certificates (Testing)

For testing or development:

```bash
ssh cuefinder@116.203.137.201
cd /home/cuefinder/app
bash deployment/setup-ssl-self-signed.sh
```

⚠️ **Warning:** Browsers will show security warnings with self-signed certificates.

---

## Manual Setup

### 1. Obtain SSL Certificates

**Option A: Let's Encrypt (Free, recommended)**
```bash
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@billiardscuefinder.com \
    -d billiardscuefinder.com \
    -d www.billiardscuefinder.com
```

**Option B: Cloudflare Origin Certificate**
1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server
2. Create Certificate
3. Save `origin-cert.pem` and `origin-key.pem`

### 2. Copy Certificates to Server

```bash
# Create SSL directory
mkdir -p /home/cuefinder/app/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/billiardscuefinder.com/fullchain.pem \
    /home/cuefinder/app/ssl/origin-cert.pem
sudo cp /etc/letsencrypt/live/billiardscuefinder.com/privkey.pem \
    /home/cuefinder/app/ssl/origin-key.pem

# Set permissions
sudo chown -R cuefinder:cuefinder /home/cuefinder/app/ssl
chmod 644 /home/cuefinder/app/ssl/origin-cert.pem
chmod 600 /home/cuefinder/app/ssl/origin-key.pem
```

### 3. Update Docker Compose

Edit `docker-compose.prod.yml`:

```yaml
volumes:
  - ./CueFinderFE/cuefinderfe/nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
  - ./ssl:/etc/nginx/ssl:ro  # Add this line
  - ./uploads:/app/uploads:ro
```

### 4. Restart Containers

```bash
cd /home/cuefinder/app
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

### 5. Verify HTTPS

```bash
curl -I https://billiardscuefinder.com
```

---

## Certificate Renewal

### Automatic (Let's Encrypt)

Add to crontab:
```bash
0 3 * * * certbot renew --quiet && \
    cp /etc/letsencrypt/live/billiardscuefinder.com/fullchain.pem /home/cuefinder/app/ssl/origin-cert.pem && \
    cp /etc/letsencrypt/live/billiardscuefinder.com/privkey.pem /home/cuefinder/app/ssl/origin-key.pem && \
    docker restart cuefinder-nginx-prod
```

### Manual Renewal

```bash
sudo certbot renew
# Then copy certs and restart as shown in step 2-4
```

---

## Troubleshooting

### Nginx fails to start

Check logs:
```bash
docker logs cuefinder-nginx-prod
```

Common issues:
- **Certificate files not found**: Verify files exist in `/home/cuefinder/app/ssl/`
- **Permission denied**: Check file permissions (644 for cert, 600 for key)
- **Port already in use**: Make sure no other service is using port 443

### Browser shows "Not Secure"

- **Self-signed cert**: This is expected, click "Advanced" → "Proceed"
- **Let's Encrypt**: Wait 5 minutes for DNS propagation
- **Certificate expired**: Renew with `sudo certbot renew`

### Mixed content warnings

Ensure your frontend uses relative URLs or HTTPS URLs for API calls.

---

## Current Status

✅ HTTP working on port 80  
⏳ HTTPS pending SSL setup

Run the Let's Encrypt script to enable HTTPS!
