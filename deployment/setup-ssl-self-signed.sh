#!/bin/bash
# Generate self-signed SSL certificates for CueFinder (testing only)

set -e

DOMAIN="billiardscuefinder.com"
SSL_DIR="/home/cuefinder/app/ssl"

echo "🔐 Generating self-signed SSL certificates for $DOMAIN"
echo "⚠️  WARNING: Self-signed certificates are for TESTING ONLY!"
echo "    Browsers will show security warnings."
echo ""

cd /home/cuefinder/app

# Create SSL directory
echo "📁 Creating SSL directory..."
sudo mkdir -p "$SSL_DIR"

# Generate self-signed certificate
echo "🔑 Generating certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/origin-key.pem" \
    -out "$SSL_DIR/origin-cert.pem" \
    -subj "/C=GR/ST=Attica/L=Athens/O=CueFinder/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN"

# Set permissions
sudo chown -R cuefinder:cuefinder "$SSL_DIR"
sudo chmod 644 "$SSL_DIR/origin-cert.pem"
sudo chmod 600 "$SSL_DIR/origin-key.pem"

echo "📋 Certificate details:"
sudo openssl x509 -in "$SSL_DIR/origin-cert.pem" -noout -subject -dates

# Update docker-compose to use SSL config
echo "⚙️  Switching to SSL configuration..."
sed -i 's|nginx-nossl.conf|nginx-ssl.conf|' docker-compose.prod.yml

# Restore SSL volume mount if not present
if ! grep -q "./ssl:/etc/nginx/ssl:ro" docker-compose.prod.yml; then
    sed -i '/nginx-ssl.conf:\/etc\/nginx\/conf.d\/default.conf:ro/a\      - ./ssl:/etc/nginx/ssl:ro' docker-compose.prod.yml
fi

# Restart containers
echo "🔄 Restarting nginx with SSL..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx

echo ""
echo "✅ Self-signed SSL setup complete!"
echo "🌐 Your site is now accessible at https://$DOMAIN"
echo "⚠️  You will see browser warnings - click 'Advanced' and 'Proceed'"
echo ""
echo "📌 For production, use Let's Encrypt instead:"
echo "   bash deployment/setup-ssl-letsencrypt.sh"
