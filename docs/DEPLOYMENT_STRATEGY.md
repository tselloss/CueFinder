# Zero-Downtime Deployment Strategy for CueFinder

## Current State
- **Current approach**: Full shutdown → rebuild → restart all containers
- **Downtime**: 5-15 minutes per deployment
- **Pipeline**: Single monolithic `deploy-production.yml` workflow
- **Components**: Backend, Frontend, Database, Moderation AI (OpenNSFW)

---

## Proposed Zero-Downtime Architecture

### 1. **Blue-Green Deployment Strategy**

Deploy new versions alongside old versions, then switch traffic with zero downtime.

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    BLUE (v1)     GREEN (v2)
    Running       Staging
```

**For Backend:**
- Run two sets of containers: `backend-blue` and `backend-green`
- Deploy new version to green
- Run health checks on green
- Switch Nginx upstream to green
- Keep blue running as instant fallback (1-2 minutes)

**For Frontend:**
- Static files: Pre-build and test, then swap directory
- No downtime since files are served directly

### 2. **Rolling Updates (Alternative to Blue-Green)**

Update containers one at a time with health checks.

```
Step 1: Scale backend to 2 replicas
Step 2: Update replica 1, verify health
Step 3: Send traffic to replica 1
Step 4: Update replica 2, verify health
Step 5: Scale back if needed
```

---

## Implementation Plan

### Phase 1: Docker Compose Enhancements

#### Step 1.1: Multi-Container Backend
Update `docker-compose.prod.yml` to support multiple backend replicas:

```yaml
services:
  backend-blue:
    container_name: cuefinder-backend-blue
    # ... existing backend config
    ports:
      - "5001:5000"
    labels:
      - "app=backend"
      - "slot=blue"

  backend-green:
    container_name: cuefinder-backend-green
    # ... identical config
    ports:
      - "5002:5000"
    labels:
      - "app=backend"
      - "slot=green"
    profiles:
      - "staging"  # Only starts when explicitly requested
```

#### Step 1.2: Nginx Upstream Configuration
Create `nginx-upstreams.conf` for dynamic traffic switching:

```nginx
upstream backend_active {
    # This is controlled by deployment script
    # Points to either backend-blue or backend-green
    server 127.0.0.1:5001;  # Default to blue
}

server {
    listen 80;
    server_name billiardscuefinder.com;

    location /api {
        proxy_pass http://backend_active;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Health check
        access_log /var/log/nginx/api_access.log;
    }
}
```

### Phase 2: Smart CI/CD Pipelines with Change Detection

#### Step 2.1: Multi-Pipeline Approach
Create separate workflows that only run when relevant files change:

**`.github/workflows/deploy-backend.yml`**
- Triggered on: changes to `CueFinderBE/**`, `SolutionLibraries/**`, `docker-compose.yml`, `docker-compose.prod.yml`
- Jobs: Build, Test, Deploy BE only
- Uses blue-green deployment

**`.github/workflows/deploy-frontend.yml`**
- Triggered on: changes to `CueFinderFE/**`, `docker-compose.yml`
- Jobs: Build, Test, Deploy FE only
- Simple file swap (zero downtime by default)

**`.github/workflows/deploy-infra.yml`**
- Triggered on: changes to database migrations, OpenNSFW, moderator service
- Jobs: Run migrations, update supporting services
- Can run independently of FE/BE

**`.github/workflows/deploy-production.yml`** (Orchestrator)
- Triggered on: manual workflow_dispatch or push to release branch
- Calls other workflows via `workflow_call`
- Provides options: full deploy, backend only, frontend only

#### Step 2.2: Change Detection Helper
Create `scripts/detect-changes.sh`:

```bash
#!/bin/bash
# Detect what components changed since last deployment

CHANGED_FILES=$(git diff HEAD~1 --name-only)

echo "backend=$(echo "$CHANGED_FILES" | grep -E '^(CueFinderBE|SolutionLibraries)' > /dev/null && echo 'true' || echo 'false')"
echo "frontend=$(echo "$CHANGED_FILES" | grep -E '^CueFinderFE' > /dev/null && echo 'true' || echo 'false')"
echo "infra=$(echo "$CHANGED_FILES" | grep -E '^(init.sql|deployment|docker-compose)' > /dev/null && echo 'true' || echo 'false')"
```

### Phase 3: Deployment Scripts

#### Step 3.1: Smart Backend Deployment
Create `deployment/deploy-backend-blue-green.sh`:

```bash
#!/bin/bash
set -e

ACTIVE_SLOT=$(cat /home/cuefinder/app/.deployment/active_slot || echo "blue")
STANDBY_SLOT=$([ "$ACTIVE_SLOT" = "blue" ] && echo "green" || echo "blue")

echo "🔄 Deploying to $STANDBY_SLOT slot (currently serving: $ACTIVE_SLOT)"

# Build new version
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend-$STANDBY_SLOT

# Start new version
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend-$STANDBY_SLOT

# Wait for container startup
sleep 5

# Health check (retry 30 times, 2 second intervals = 60 seconds)
for i in {1..30}; do
    if curl -f http://localhost:500$([[ $STANDBY_SLOT == "blue" ]] && echo 1 || echo 2)/health > /dev/null 2>&1; then
        echo "✓ Health check passed"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "✗ Health check failed after 60 seconds"
        docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend-$STANDBY_SLOT
        exit 1
    fi
    echo "  Checking health... ($i/30)"
    sleep 2
done

# Graceful drain: give in-flight requests up to 30 seconds to complete
echo "🕐 Draining active slot ($ACTIVE_SLOT)..."
docker exec cuefinder-backend-$ACTIVE_SLOT /bin/sh -c 'echo "shutting-down" > /tmp/shutdown-signal' 2>/dev/null || true
sleep 30

# Switch traffic
echo "🔀 Switching traffic to $STANDBY_SLOT slot"
echo "$STANDBY_SLOT" > /home/cuefinder/app/.deployment/active_slot

# Reload Nginx to pick up new upstream
nginx -s reload

# Stop old container (keep for quick rollback)
echo "⏸ Keeping old slot ($ACTIVE_SLOT) running as fallback for 5 minutes"
# Could add cleanup scheduled job here

echo "✅ Deployment complete!"
```

#### Step 3.2: Frontend Deployment
Create `deployment/deploy-frontend.sh`:

```bash
#!/bin/bash
set -e

echo "📦 Building frontend..."
# Build the frontend (wherever it's built)
cd /home/cuefinder/app/CueFinderFE
npm run build

# Swap directories atomically
echo "🔄 Deploying new version..."
CURRENT=$(ls -d /var/www/cuefinder/current-* 2>/dev/null | tail -1)
NEW="/var/www/cuefinder/current-$(date +%s)"

cp -r build $NEW
ln -sfn $NEW /var/www/cuefinder/current

echo "✅ Frontend deployed (0 downtime)"
```

### Phase 4: Database Migration Strategy

Separate database migrations from application deployment:

```bash
# 1. Run migrations BEFORE deploying new code (backward compatible)
docker exec cuefinder-postgres-prod /bin/bash -c 'psql -U postgres -d cuefinder < /migrations/001_add_new_column.sql'

# 2. Deploy new code that uses the column
# 3. Run cleanup migrations AFTER code is stable
```

---

## Recommended Approach: **Hybrid Strategy**

Use Blue-Green for Backend + Rolling for optional components:

### ✅ What This Enables

1. **Zero-Downtime Deployments**
   - Blue-green switching in <5 seconds
   - Instant rollback if needed
   
2. **Selective Deployments**
   - Deploy only backend (5 minutes)
   - Deploy only frontend (1 minute)
   - Deploy only database migrations (2 minutes)
   
3. **Health Checks**
   - Auto-rollback on failed health checks
   - Gradual traffic shift with monitoring

4. **Graceful Shutdown**
   - Active requests complete before switch
   - No dropped connections

5. **Cost Efficient**
   - Keep old version for 2-3 minutes as fallback
   - Then auto-cleanup

---

## Implementation Timeline

| Phase | Effort | Benefit | Timeline |
|-------|--------|---------|----------|
| **Phase 1a** | 2 hours | Multi-backend containers | Week 1 |
| **Phase 1b** | 1 hour | Nginx upstreams config | Week 1 |
| **Phase 2a** | 3 hours | Separate BE deployment workflow | Week 2 |
| **Phase 2b** | 2 hours | Change detection | Week 2 |
| **Phase 3a** | 4 hours | Blue-green deployment scripts | Week 2 |
| **Phase 3b** | 1 hour | Frontend deployment script | Week 3 |
| **Phase 4** | 2 hours | Database migration separation | Week 3 |
| **Testing & Refinement** | 4 hours | Full integration testing | Week 3-4 |

---

## Rollback Strategy

### If Deployment Fails:

```bash
# Switch back to previous version
echo "blue" > /home/cuefinder/app/.deployment/active_slot
nginx -s reload
# Old container is still running, instant rollback
```

### If Health Check Fails:

Automatic in the deployment script:
- Don't switch traffic
- Keep old version running
- Alert DevOps
- Old slot remains as fallback

---

## Monitoring & Alerts

Add to each deployment:

```bash
# Log deployment event
echo "$(date): Switched to $STANDBY_SLOT" >> /var/log/cuefinder/deployments.log

# Notify monitoring system
curl -X POST https://monitoring.example.com/deployment \
  -d "version=$NEW_VERSION&slot=$STANDBY_SLOT&status=success"
```

---

## Quick Start Commands (Once Implemented)

```bash
# Deploy only backend changes
./deploy-backend-blue-green.sh

# Deploy only frontend changes
./deploy-frontend.sh

# Full deployment with smart detection
./deployment/deploy-full.sh  # Auto-deploys only changed components

# Rollback last deployment
./deployment/rollback.sh

# Check deployment status
docker compose ps
cat /home/cuefinder/app/.deployment/active_slot
```

---

## Files to Create/Modify

### New Files:
- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-frontend.yml`
- `.github/workflows/deploy-infra.yml`
- `deployment/deploy-backend-blue-green.sh`
- `deployment/deploy-frontend.sh`
- `deployment/rollback.sh`
- `scripts/detect-changes.sh`
- `deployment/nginx-upstreams.conf`

### Modified Files:
- `docker-compose.prod.yml` (add blue/green services)
- `.github/workflows/deploy-production.yml` (orchestrator)

---

## Security Considerations

✅ Keep SSH key in GitHub secrets  
✅ Health checks prevent broken builds from going live  
✅ Gradual traffic shift allows real-time monitoring  
✅ Automatic rollback on failure  
✅ Zero-downtime = no forced user disconnects  

---

## Next Steps

1. Review this strategy with your team
2. Start with Phase 1 (Docker compose multi-container setup)
3. Implement health checks in backend
4. Create blue-green deployment script
5. Test with manual deployment
6. Integrate into GitHub Actions
7. Add change detection and split workflows

Would you like me to start implementing any of these phases?
