# Zero-Downtime Deployment - Visual Guide

## 🎯 The Problem You Had

```
Current Deployment Process:
┌──────────────────────────────────────────────────┐
│  You push to 'release' branch                    │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  ⚠️  STOP ALL CONTAINERS (DOWNTIME STARTS!)     │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  Rebuild Docker images (~5 minutes)              │
│  Users see: "Service Unavailable"                │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  Start all containers                            │
│  Wait for databases to initialize                │
│  Total downtime: 5-15 minutes ❌                │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  ✓ App is back online                            │
│  No health checks, no way to rollback            │
└──────────────────────────────────────────────────┘
```

---

## 🚀 The Solution You Have Now

```
New Zero-Downtime Deployment Process:

BEFORE DEPLOYMENT:
    Port 5001: BLUE (serving users)
    Port 5002: GREEN (not running)

    Users → Nginx → BLUE (works fine!)
    
┌──────────────────────────────────────────────────┐
│  You push to 'release' branch                    │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  GitHub Actions detects changes                  │
│  (Backend? Frontend? Both? Infra?)              │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  PARALLEL BUILD (while BLUE still serving):      │
│  - Pull code to GREEN                            │
│  - Build image for GREEN                         │
│  - Start GREEN container                         │
│  Users: ✓ No impact (BLUE still serving!)        │
└──────────────────┬───────────────────────────────┘
                   ↓
    Port 5001: BLUE (serving users)
    Port 5002: GREEN (starting up)
                   ↓
┌──────────────────────────────────────────────────┐
│  Test GREEN with health checks:                  │
│  curl http://localhost:5002/health               │
│  - If fails → stop, keep BLUE, no downtime ✓     │
│  - If passes → continue                          │
│  Users: ✓ Still no impact                        │
└──────────────────┬───────────────────────────────┘
                   ↓
    Port 5001: BLUE (serving users)
    Port 5002: GREEN (healthy & ready)
                   ↓
┌──────────────────────────────────────────────────┐
│  Graceful Drain Phase (30 seconds):              │
│  - Signal BLUE to stop accepting NEW requests    │
│  - Let existing requests finish                  │
│  - New requests still work (BLUE draining)       │
│  Users: ✓ Requests complete normally             │
└──────────────────┬───────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│  TRAFFIC SWITCH (<1 SECOND):                     │
│  Update routing rules:                           │
│  - OLD: Users → Nginx → BLUE                     │
│  - NEW: Users → Nginx → GREEN                    │
│  ⚡ This happens SO FAST users don't notice ⚡   │
└──────────────────┬───────────────────────────────┘
                   ↓
    Port 5001: BLUE (old version, stopped)
    Port 5002: GREEN (serving users now!)
                   ↓
┌──────────────────────────────────────────────────┐
│  Cleanup Phase:                                  │
│  - Keep BLUE running 5 minutes (fallback ready)  │
│  - Monitor GREEN in production                   │
│  - After 5 min, delete BLUE container            │
│  Users: ✓ Everything works normally              │
└──────────────────┬───────────────────────────────┘
                   ↓
                ✓ Deployment Complete
            Downtime: < 1 SECOND ✅
```

---

## 🔄 The Rollback Scenario

```
If GREEN fails or has issues:

ACTIVE NOW: GREEN (on port 5002)
FALLBACK:   BLUE (still running on port 5001)

YOU RUN:    bash deployment/rollback.sh

RESULT:
    1. Graceful drain GREEN (30 sec)
    2. Switch traffic: Users → BLUE (< 1 sec)
    3. Delete GREEN container
    4. Back to stable version

Total Rollback Time: ~45 seconds

NO DOWNTIME! Just switched back to previous version ✓
```

---

## 🎯 Component-Level Deployments

```
Your repository structure:

CueFinderBE/     ← Backend (ASP.NET)
CueFinderFE/     ← Frontend (React/Node)
CueFinderModerator/    ← Moderation service
init.sql/        ← Database schemas
docker-compose.prod.yml ← Infrastructure

THE SMART PART:

Developer changes CueFinderBE/ only:
    ✓ Deploy-backend.yml runs
    ✓ Frontend NOT rebuilt (saves 3 minutes)
    ✓ Database NOT touched
    ✓ Moderation service NOT restarted
    → Total: ~7 minutes deployment

Developer changes CueFinderFE/ only:
    ✓ Deploy-frontend.yml runs
    ✓ Backend NOT rebuilt
    ✓ Database NOT touched
    ✓ Just copies new static files
    → Total: ~2 minutes deployment

Developer adds database migration:
    ✓ Deploy-infra.yml runs
    ✓ Creates backup first
    ✓ Runs migration
    ✓ Backend uses new schema (already compatible)
    → Total: ~3 minutes deployment
```

---

## 📊 Before & After Timeline

### BEFORE (5-15 minutes downtime):
```
0:00  - Start deployment                    ↓
0:05  - Stop all containers            🔴 DOWNTIME
0:06  - Rebuild images               🔴 DOWNTIME
0:11  - Start containers              🔴 DOWNTIME
0:12  - Wait for databases            🔴 DOWNTIME
0:15  - Everything online             ✓ Back up

Total downtime: 15 minutes ❌
Users see: Service Unavailable page
```

### AFTER (< 1 second downtime):
```
0:00  - Commit pushed to release
0:01  - GitHub Actions detects changes
0:01  - Builds GREEN (in parallel)   ✓ BLUE still serving
0:05  - Tests GREEN health check      ✓ BLUE still serving
0:06  - Graceful drain BLUE           ✓ Requests finish normally
0:07  - Switch traffic to GREEN       🔄 < 1 SECOND SWITCH
0:07  - Update complete              ✓ GREEN now serving
0:12  - Keep BLUE for rollback        ✓ Fallback ready

Total downtime: < 1 SECOND ✅
User impact: UNNOTICEABLE 🚀
```

---

## 🛡️ Safety Features

```
1. HEALTH CHECKS
   ┌─────────────────────────┐
   │ Is GREEN healthy?       │
   │ curl /health endpoint   │
   ├─────────────────────────┤
   │ ✓ Yes → proceed         │
   │ ✗ No  → keep BLUE, skip │
   └─────────────────────────┘

2. GRACEFUL SHUTDOWN
   ┌──────────────────────────────────┐
   │ 1. Stop accepting NEW requests   │
   │ 2. Wait 30 seconds for current   │
   │    requests to finish            │
   │ 3. THEN switch traffic           │
   └──────────────────────────────────┘

3. INSTANT ROLLBACK
   ┌──────────────────────────────────┐
   │ Old version still running!        │
   │ 1 command to switch back          │
   │ Takes ~45 seconds total           │
   └──────────────────────────────────┘

4. SMOKE TESTS
   ┌──────────────────────────────────┐
   │ After switch, test endpoints     │
   │ - /health                        │
   │ - /api/users                     │
   │ If fails → rollback automatic    │
   └──────────────────────────────────┘
```

---

## 🔧 Architecture Diagram

```
Load Balancer / Reverse Proxy (Nginx)
│
├─── :80/443 (user traffic)
│    └─► Upstream switch logic
│        (points to blue or green)
│
├─────────────────────────────────────────
│
├─── Backend Blue          Backend Green
│    Container             Container
│    Port: 5001            Port: 5002
│    Status: ACTIVE        Status: STAGING
│    Version: v1.2.3       Version: v1.2.4
│    Health: ✓ UP          Health: ✓ UP
│
├─────────────────────────────────────────
│
├─── PostgreSQL Database
│    Shared by both backends
│    Volume: postgres_data
│    Port: 5432 (internal only)
│
├─────────────────────────────────────────
│
└─── Supporting Services
     ├─ OpenNSFW (moderation)
     ├─ Moderator (admin interface)
     └─ PgAdmin (database admin)
```

---

## 📈 Deployment Pipeline Decision Tree

```
                   ┌─ Push to 'release' ─┐
                   │                     │
                   ↓                     ↓
         ┌─────────────────────────────────────────┐
         │  Detect what files changed               │
         └──────┬──────────────────────────────────┘
                │
        ┌───────┼────────────────┬──────────────┐
        ↓       ↓                ↓              ↓
    Backend Frontend Moderator Database
      Code     Code              Service      Migration
        │       │                │            │
        ↓       ↓                ↓            ↓
    Deploy  Deploy          Deploy       Run Migrations
    Backend Frontend        Infra        + Update Services
        │       │                │            │
        ↓       ↓                ↓            ↓
    Blue-Green Static File    Docker      Backup DB
    Deployment   Swap      Compose Up     + Execute SQL
        │       │                │            │
        ↓       ↓                ↓            ↓
    Health  Verify        Verify            Verify
    Checks  HTML file     Services          Migrations
        │       │                │            │
        └───────┴────────────────┴────────────┘
                    │
                    ↓
            ✓ Deployment Success
            Slack Notification
```

---

## 🎮 User Experience During Deployment

### OLD SYSTEM:
```
[0:00] User hits website
       ↓
[0:02] "Oops, service is down"
       ↓
[0:05] Still down...
       ↓
[0:10] Still down...
       ↓
[0:15] Page finally loads
       ↓
       😤 User annoyed
```

### NEW SYSTEM:
```
[0:00] User hits website
       ↓
[0:00.001] Request succeeds normally
           (App deployment happening in background!)
           ↓
[0:07] Deployment completes
       (User never noticed)
       ↓
       😊 User happy
       (Didn't even know there was a deployment)
```

---

## 🚀 Commands You'll Use

```
# Automatic (let GitHub Actions do it):
git push origin release
→ GitHub Actions auto-detects changes
→ Appropriate pipeline(s) run
→ Deployment happens automatically

# Manual (if you SSH to server):
bash deployment/deploy-backend-blue-green.sh

# Rollback (instant):
bash deployment/rollback.sh --force

# Check status:
cat .deployment/active_slot
docker compose ps

# Verify health:
curl http://localhost:5001/health  # Blue
curl http://localhost:5002/health  # Green
```

---

## ⏱️ Time Breakdown

### Complete Deployment Timeline:

```
Time  | Action                    | User Impact
------|---------------------------|------------------
0:00  | Commit pushed            | ✓ None
0:01  | GitHub Actions triggered | ✓ None
0:02  | Build starts (parallel)  | ✓ None (BLUE serving)
0:06  | Build completes          | ✓ None
0:06  | Health checks GREEN      | ✓ None
0:07  | Drain BLUE (30 sec)      | ✓ Requests finish
0:07  | Switch to GREEN          | 🔄 < 1 SECOND SWITCH
0:07  | Deployment complete!     | ✓ None
```

**Total deployment: ~7 minutes**  
**User downtime: <1 second** ✅

---

## 📋 Checklist for Your First Deployment

- [ ] Read DEPLOYMENT_QUICKSTART.md
- [ ] Make scripts executable: `chmod +x deployment/*.sh scripts/*.sh`
- [ ] Create deployment dir on server: `mkdir -p /home/cuefinder/app/.deployment`
- [ ] Initialize active slot: `echo "blue" > /home/cuefinder/app/.deployment/active_slot`
- [ ] Push small test change to release branch
- [ ] Watch GitHub Actions run (should take ~7 minutes)
- [ ] Verify site still works: Visit https://billiardscuefinder.com
- [ ] Check health endpoint: `curl https://billiardscuefinder.com/api/health`
- [ ] Test rollback: `ssh server "bash /home/cuefinder/app/deployment/rollback.sh --force"`
- [ ] Verify rollback worked

That's it! You're ready to deploy with zero downtime! 🎉

---

**Next Step:** Read `DEPLOYMENT_QUICKSTART.md` to get started!
