# CueFinderModerator Deployment Guide

## Overview

CueFinderModerator is a microservice designed to handle content moderation independently from the main backend. This guide covers the complete deployment process with smart change detection.

## Features

### ✅ Smart Deployment
- **Change Detection**: Only rebuilds Docker image when CueFinderModerator folder changes
- **State Tracking**: Uses SHA256 hash to track folder modifications
- **Efficient**: Skips unnecessary rebuilds and container restarts
- **Cross-Platform**: PowerShell (Windows) and Bash (Linux/Mac) scripts

### ✅ Initialization & Validation
- Verifies project structure
- Checks Docker and .NET installations
- Validates database requirements
- Displays pre-deployment checklist

### ✅ Production Ready
- Multi-stage Docker build for optimized images
- Health check monitoring
- Automatic database migrations
- Proper error handling and logging

## Quick Start

### 1. Verify Installation

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File init-moderator.ps1

# Linux/Mac
bash init-moderator.sh
```

**Expected Output**: All checks should pass ✅

### 2. Deploy Moderator Service

```powershell
# Windows - Smart deploy (only rebuild if changes detected)
powershell -ExecutionPolicy Bypass -File deploy-moderator.ps1

# Windows - Force rebuild
powershell -ExecutionPolicy Bypass -File deploy-moderator.ps1 -Force

# Windows - Just restart (no rebuild)
powershell -ExecutionPolicy Bypass -File deploy-moderator.ps1 -NoBuild
```

```bash
# Linux/Mac - Smart deploy
bash deploy-moderator.sh

# Linux/Mac - Force rebuild
bash deploy-moderator.sh --force

# Linux/Mac - Just restart
bash deploy-moderator.sh --no-build
```

### 3. Verify Deployment

```bash
# Check container status
docker ps -a --filter "name=cuefinder-moderator"

# View logs
docker logs cuefinder-moderator

# Test health endpoint
curl http://localhost:5001/health
```

## Files Overview

### Deployment Scripts

#### `deploy-moderator.ps1` (PowerShell)
- **Purpose**: Smart deployment with change detection
- **Platform**: Windows (requires PowerShell 5+)
- **Features**:
  - Automatic hash-based change detection
  - Docker image building
  - Container lifecycle management
  - Health check validation
- **Output**: Detailed logs to `moderator-deploy.log`

**Usage**:
```powershell
./deploy-moderator.ps1                    # Normal deployment
./deploy-moderator.ps1 -Force             # Force rebuild
./deploy-moderator.ps1 -NoBuild           # Skip rebuild, restart only
./deploy-moderator.ps1 -StateFile "path"  # Custom state file
```

#### `deploy-moderator.sh` (Bash)
- **Purpose**: Cross-platform deployment script
- **Platform**: Linux, Mac, Windows (WSL)
- **Features**: Same as PowerShell version
- **Output**: Logs to `moderator-deploy.log`

**Usage**:
```bash
./deploy-moderator.sh               # Normal deployment
./deploy-moderator.sh --force       # Force rebuild
./deploy-moderator.sh --no-build    # Skip rebuild
```

#### `init-moderator.ps1` (Project Setup)
- **Purpose**: Initialize and verify project setup
- **Checks**:
  - Project file structure
  - Docker installation
  - .NET 8.0 availability
  - Database requirements
  - Optional full build test
- **Output**: Formatted checklist with recommendations

**Usage**:
```powershell
./init-moderator.ps1              # Basic checks
./init-moderator.ps1 -Full        # Include build test
./init-moderator.ps1 -Verbose     # Detailed output
```

### Configuration Files

#### `CueFinderModerator/Dockerfile`
Multi-stage Docker build configuration:
1. **Builder Stage**: Compiles .NET application
2. **Publish Stage**: Prepares release artifacts
3. **Runtime Stage**: Minimal production image

Key features:
- .NET 8.0 SDK for compilation
- .NET 8.0 ASP.NET runtime for execution
- Optimized layer caching
- Minimal final image size

#### `docker-compose.yml` Updates
Added moderator service configuration:
```yaml
moderator:
  build:
    context: .
    dockerfile: CueFinderModerator/Dockerfile
  container_name: cuefinder-moderator
  ports:
    - "5001:5001"
  environment:
    - ASPNETCORE_ENVIRONMENT=Development
    - ConnectionStrings__DefaultConnection=...
    - JwtSettings__*=...
  depends_on:
    - postgres
    - nudenet
```

## Configuration

### Environment Variables

Set in `docker-compose.yml` or appsettings files:

```
ASPNETCORE_ENVIRONMENT=Development|Staging|Production
ConnectionStrings__DefaultConnection=Host=host;Port=5432;Database=db;...
JwtSettings__SecretKey=your-secret-key-min-32-chars
JwtSettings__Issuer=CueFinder
JwtSettings__Audience=CueFinderUsers
JwtSettings__ExpirationMinutes=60
Moderation__NudeNetUrl=http://nudenet:8000
```

### Database Setup

The application uses auto-migration:

1. Database created automatically from migrations
2. Moderator-specific tables initialized
3. Moderation fields added to existing tables

**Required Tables**:
- Users, Cues, CueCases, Messages, Discussions, Posts
- All with moderation fields (IsModerated, ModerationReason, etc.)

## Deployment Workflow

### Development/Local

```powershell
# 1. Verify setup
./init-moderator.ps1

# 2. Start all services
docker-compose up -d

# 3. Deploy moderator (first time)
./deploy-moderator.ps1

# 4. After changes to CueFinderModerator/
./deploy-moderator.ps1    # Auto-detects changes
```

### Production

```bash
# 1. Verify setup
bash init-moderator.sh

# 2. Update configuration
# Edit appsettings.Production.json with production values

# 3. Deploy with force flag (first deployment)
bash deploy-moderator.sh --force

# 4. Future deployments (auto change detection)
bash deploy-moderator.sh
```

## Monitoring & Troubleshooting

### Check Container Status

```bash
# View all containers
docker ps -a

# View moderator specific
docker ps -a --filter "name=cuefinder-moderator"

# View full container details
docker inspect cuefinder-moderator
```

### View Logs

```bash
# Current logs
docker logs cuefinder-moderator

# Stream logs (follow)
docker logs -f cuefinder-moderator

# Last 100 lines
docker logs --tail 100 cuefinder-moderator

# With timestamps
docker logs -t cuefinder-moderator
```

### Common Issues

#### 1. Database Column Already Exists
```
Error: column "X" of relation "Y" already exists
```
**Solution**: Migration already partially applied. Options:
- Check database state
- Skip migration by modifying migration file
- Recreate database if safe

#### 2. Service Won't Start
```
curl: (7) Failed to connect to localhost:5001
```
**Solution**:
```bash
docker logs cuefinder-moderator  # Check error
docker restart cuefinder-moderator  # Restart
```

#### 3. Port Already in Use
```
Error: bind: address already in use :::5001
```
**Solution**:
```bash
# Find process using port 5001
lsof -i :5001

# Kill process or change docker-compose port mapping
```

#### 4. Out of Disk Space
```
Error: no space left on device
```
**Solution**:
```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Script State File

The deployment script tracks changes using `.moderator-deploy-state`:
- Contains SHA256 hash of CueFinderModerator folder
- Updated after successful build
- Used for change detection

**Manual Reset**:
```bash
rm .moderator-deploy-state    # Will trigger rebuild on next deploy
```

## Performance Notes

### Build Time
- **First build**: 7-10 minutes (downloads dependencies)
- **Subsequent builds**: 1-3 minutes (cached layers)
- **No-build restart**: <5 seconds

### Deployment Time
- Smart detection: <1 second
- Image build: 3-7 minutes
- Container start: 5-15 seconds
- Database migration: 2-30 seconds (depending on migrations)

### Disk Usage
- Base image: ~200 MB
- Built application: ~300 MB
- Total per instance: ~500 MB

## Integration with Main Backend

The moderator service integrates with CueFinderBE via:

1. **HTTP Requests** (HttpModerationClient)
   - Base URL: `http://moderator:5001` (docker network)
   - Authentication: JWT tokens

2. **Shared Database**
   - Same PostgreSQL instance
   - Same tables with moderation fields
   - Coordinated migrations

3. **API Endpoints**
   - Main backend calls moderator endpoints
   - Moderator updates content moderation status
   - Async processing for heavy operations

## Security Considerations

### Before Production Deployment

⚠️ **Critical**:
- [ ] Update JWT secret keys (min 32 characters)
- [ ] Set ASPNETCORE_ENVIRONMENT=Production
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable authentication on all endpoints
- [ ] Configure CORS for allowed origins

### Docker Best Practices
- Use private container registries
- Sign images
- Scan for vulnerabilities
- Regular updates

```bash
# Scan image for vulnerabilities
docker scout cves cuefinder-moderator:latest
```

## Rollback Procedure

If deployment fails or needs rollback:

```bash
# 1. Check previous state
docker images | grep cuefinder-moderator

# 2. Stop current service
docker stop cuefinder-moderator

# 3. Remove state file to force rebuild
rm .moderator-deploy-state

# 4. Restart with previous version
docker-compose up -d moderator

# 5. Or redeploy with force
./deploy-moderator.ps1 -Force
```

## Maintenance

### Regular Tasks

**Weekly**:
- Monitor logs for errors
- Check disk usage
- Verify health endpoints

**Monthly**:
- Update base images
- Review and clean Docker cache
- Check for new .NET security patches

**Quarterly**:
- Full rebuild test
- Load testing
- Security audit

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup
docker system prune -a --volumes
```

## Example CI/CD Integration

### GitHub Actions

```yaml
name: Deploy CueFinderModerator
on:
  push:
    paths:
      - 'CueFinderModerator/**'
    branches:
      - main
      - DEV

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Server
        run: |
          ssh user@server "cd ~/app && bash deploy-moderator.sh"
```

## Support & Debugging

### Enable Debug Logging

In `appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}
```

### Get Detailed Status

```bash
# Full container details
docker inspect cuefinder-moderator | jq '.[]'

# Network connectivity
docker exec cuefinder-moderator ping postgres

# Port status
docker exec cuefinder-moderator netstat -tlnp
```

### Performance Analysis

```bash
# CPU and memory usage
docker stats cuefinder-moderator

# Disk usage
docker exec cuefinder-moderator du -sh /app

# Process list
docker exec cuefinder-moderator ps aux
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [.NET 8.0 Release Notes](https://github.com/dotnet/core/releases)
- [ASP.NET Core Deployment](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)

## FAQ

**Q: How often should I rebuild?**
A: The smart deployment automatically rebuilds only when changes are detected. Rebuild frequency depends on your development pace.

**Q: Can I deploy multiple instances?**
A: Yes, use different container names and ports in docker-compose:
```yaml
moderator-1:
  container_name: cuefinder-moderator-1
  ports:
    - "5001:5001"

moderator-2:
  container_name: cuefinder-moderator-2
  ports:
    - "5002:5001"
```

**Q: What's the database schema?**
A: See CueFinder.Database project. Moderator uses auto-migration for schema updates.

**Q: Can I use this without Docker?**
A: Yes, but you need to:
1. Install .NET 8.0 SDK
2. Set up PostgreSQL manually
3. Run `dotnet run` from CueFinderModerator folder

**Q: How do I update the application?**
A: Simply git pull and run deployment script:
```bash
git pull origin DEV
bash deploy-moderator.sh
```

## Version History

### v1.0 (Current)
- Initial deployment infrastructure
- Smart change detection
- Docker containerization
- Cross-platform scripts
- Production-ready configuration
