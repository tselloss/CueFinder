#!/bin/bash
# Setup SSL certificates using Let's Encrypt for CueFinder production

set -e

DOMAIN="billiardscuefinder.com"
EMAIL="admin@billiardscuefinder.com"
SSL_DIR="/home/cuefinder/app/ssl"

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Check if running as cuefinder user
if [ "$USER" != "cuefinder" ]; then
    echo "❌ This script must be run as the cuefinder user"
    exit 1
fi

cd /home/cuefinder/app

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# Stop nginx temporarily to allow certbot to bind to port 80
echo "🛑 Stopping nginx temporarily..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

# Obtain certificate
echo "📜 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Create SSL directory
echo "📁 Setting up SSL directory..."
sudo mkdir -p "$SSL_DIR"

# Copy certificates to our ssl directory
echo "📋 Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$SSL_DIR/origin-cert.pem"
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$SSL_DIR/origin-key.pem"

# Set permissions
sudo chown -R cuefinder:cuefinder "$SSL_DIR"
sudo chmod 644 "$SSL_DIR/origin-cert.pem"
sudo chmod 600 "$SSL_DIR/origin-key.pem"

# Update docker-compose to use SSL config
echo "⚙️  Switching to SSL configuration..."
sed -i 's|nginx-nossl.conf|nginx-ssl.conf|' docker-compose.prod.yml

# Restore SSL volume mount if commented/removed
if ! grep -q "./ssl:/etc/nginx/ssl:ro" docker-compose.prod.yml; then
    # Add SSL volume mount after the nginx config line
    sed -i '/nginx-ssl.conf:\/etc\/nginx\/conf.d\/default.conf:ro/a\      - ./ssl:/etc/nginx/ssl:ro' docker-compose.prod.yml
fi

# Restart containers
echo "🔄 Restarting containers with SSL..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Setup auto-renewal
echo "⏰ Setting up automatic certificate renewal..."
CRON_CMD="0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/origin-cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/origin-key.pem && docker restart cuefinder-nginx-prod"

(sudo crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | sudo crontab -

echo ""
echo "✅ SSL setup complete!"
echo "🌐 Your site should now be accessible at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔄 Certificates will auto-renew at 3 AM daily"
