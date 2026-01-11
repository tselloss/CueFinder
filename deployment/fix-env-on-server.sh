#!/bin/bash
# Quick fix script to update .env on production server
# Run this locally: bash deployment/fix-env-on-server.sh

set -e

SERVER_USER="cuefinder"
SERVER_IP="116.203.137.201"
APP_DIR="/home/cuefinder/app"

echo "🔧 Fixing .env file on production server..."

# SSH into server and update .env file
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /home/cuefinder/app

# Backup existing .env if it exists
if [ -f .env ]; then
  cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backed up existing .env file"
fi

# Create new .env with all required variables
cat > .env << 'EOF'
DB_PASSWORD=CueFinderDB2024SecurePass
JWT_SECRET=CueFinderJWT2024VerySecureSecretKey256Bits
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
EOF

echo "✅ Created new .env file with all required variables"
cat .env

echo ""
echo "🐳 Restarting backend container..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
else
  docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
fi

echo "✅ Backend restarted!"
echo ""
echo "📊 Checking container status..."
sleep 5
docker ps --format 'table {{.Names}}\t{{.Status}}'

ENDSSH

echo ""
echo "✅ Done! Check the backend logs with:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'docker logs cuefinder-backend-prod --tail 50'"
