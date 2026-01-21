#!/bin/bash
# Setup script for Image Moderation System

set -e

echo "🛡️ Setting up CueFinder Image Moderation System..."

# 1. Create upload directories
echo "📁 Creating upload directories..."
mkdir -p ./uploads/temp
mkdir -p ./uploads/approved
mkdir -p ./uploads/moderation

# 2. Apply database migrations
echo "🗄️ Applying database migrations..."
cd CueFinderBE
dotnet ef database update
cd ..

# 3. Build NudeNet container
echo "🐳 Building NudeNet microservice..."
docker build -f deployment/Dockerfile.nudenet -t cuefinder-nudenet:latest .

# 4. Update docker-compose
echo "🚀 Starting services with docker-compose..."
docker-compose down 2>/dev/null || true
docker-compose up -d

# 5. Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:8001/health >/dev/null 2>&1; then
        echo "✅ NudeNet service is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ NudeNet service health check failed"
        exit 1
    fi
    sleep 2
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Service URLs:"
echo "  - Backend API: http://localhost:5000"
echo "  - Frontend: http://localhost:3000"
echo "  - NudeNet Health: http://localhost:8001/health"
echo ""
echo "📝 Next steps:"
echo "  1. Upload an image via /api/moderation/upload-image"
echo "  2. View pending flags at /api/moderation/pending (admin only)"
echo "  3. Use ModerationDashboard component for admin review"
echo ""
