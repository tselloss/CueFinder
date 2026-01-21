@echo off
REM Setup script for Image Moderation System (Windows PowerShell)

echo.
echo 🛡️ Setting up CueFinder Image Moderation System...
echo.

REM 1. Create upload directories
echo 📁 Creating upload directories...
if not exist "uploads\temp" mkdir "uploads\temp"
if not exist "uploads\approved" mkdir "uploads\approved"
if not exist "uploads\moderation" mkdir "uploads\moderation"

REM 2. Apply database migrations
echo 🗄️ Applying database migrations...
cd CueFinderBE
dotnet ef database update
cd ..

REM 3. Build NudeNet container
echo 🐳 Building NudeNet microservice...
docker build -f deployment/Dockerfile.nudenet -t cuefinder-nudenet:latest .

REM 4. Update docker-compose
echo 🚀 Starting services with docker-compose...
docker-compose down 2>nul
docker-compose up -d

REM 5. Wait for services to be healthy
echo ⏳ Waiting for services to be healthy...
timeout /t 30 /nobreak

echo.
echo ✅ Setup complete!
echo.
echo 📍 Service URLs:
echo   - Backend API: http://localhost:5000
echo   - Frontend: http://localhost:3000
echo   - NudeNet Health: http://localhost:8001/health
echo.
echo 📝 Next steps:
echo   1. Upload an image via POST /api/moderation/upload-image
echo   2. View pending flags at GET /api/moderation/pending
echo   3. Use ModerationDashboard component for admin review
echo.
