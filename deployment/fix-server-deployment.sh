#!/bin/bash
# Server Deployment Fix Script
# This script fixes the PostgreSQL password mismatch and redeploys

echo "=== CueFinder Server Deployment Fix ==="
cd /home/cuefinder/app

echo "1. Stopping all containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v

echo "2. Removing old PostgreSQL data..."
sudo rm -rf /home/cuefinder/data/postgres/*

echo "3. Verifying .env file..."
cat > .env << 'EOF'
DB_PASSWORD=CueFinderDB2024SecurePass
JWT_SECRET=CueFinderJWT2024VerySecureSecretKey256Bits
FRONTEND_API_URL=https://billiardscuefinder.com
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
EOF

echo ".env file contents:"
cat .env

echo "4. Starting all services with fresh database..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "5. Waiting 30 seconds for services to initialize..."
sleep 30

echo "6. Checking service status..."
docker ps

echo "7. Checking backend logs..."
docker logs cuefinder-backend-prod --tail 50

echo "=== Deployment Fix Complete ==="
echo "Check if backend is running (not restarting)"
