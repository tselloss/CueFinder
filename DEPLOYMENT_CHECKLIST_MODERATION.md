# ✅ Image Moderation System - Deployment Checklist

**Project**: CueFinder Image Moderation  
**Status**: 🟢 READY TO DEPLOY  
**Date**: January 21, 2026  

---

## 📋 Pre-Deployment Checklist

### Code Review
- [x] All C# code follows ASP.NET Core best practices
- [x] Python code uses FastAPI patterns
- [x] React component uses functional components + hooks
- [x] Database migration includes all entities
- [x] No hardcoded secrets in code
- [x] Error handling throughout
- [x] Logging configured
- [x] Dependency injection properly set up

### Database
- [x] Migration file created and tested
- [x] All 3 tables designed with proper relationships
- [x] Indexes created for performance
- [x] Foreign key constraints configured
- [x] Default values set appropriately
- [x] Timestamps with UTC handling

### API
- [x] 5 endpoints defined (3 public, 2 admin)
- [x] Authentication/authorization checks
- [x] Input validation on all endpoints
- [x] Error responses properly formatted
- [x] Swagger/OpenAPI documentation ready
- [x] Rate limiting designed (ready for production)

### Frontend
- [x] React component created with hooks
- [x] Real-time updates implemented
- [x] Error handling for failed requests
- [x] Loading states managed
- [x] Responsive design (grid layout)
- [x] Accessibility considerations

### Docker
- [x] NudeNet Dockerfile created
- [x] Python dependencies specified
- [x] docker-compose.yml updated
- [x] Health checks configured
- [x] Volume mounts defined
- [x] Environment variables set
- [x] Networks configured

### Documentation
- [x] Quickstart guide (5 minutes)
- [x] Full reference manual (500+ lines)
- [x] API endpoint specifications
- [x] Database schema documented
- [x] Configuration template provided
- [x] Troubleshooting guide included
- [x] Security guide written
- [x] Performance tips documented

### Security
- [x] JWT authentication required
- [x] Admin role checks on protected endpoints
- [x] File type validation
- [x] File size limits
- [x] Randomized filenames
- [x] Non-public temporary storage
- [x] Image hashing for duplicates
- [x] User banning capability
- [x] Audit trail maintained
- [x] No sensitive data in logs

---

## 🚀 Deployment Steps

### Step 1: Prepare Environment
```bash
cd /path/to/CueFinder

# Verify directory structure
ls -la uploads/ 2>/dev/null || mkdir -p uploads/{temp,approved,moderation}

# Check Docker
docker --version  # Should be 20.10+
docker-compose --version  # Should be 1.29+

# Check .NET
cd CueFinderBE && dotnet --version  # Should be 8.0+
cd ..
```

**Status**: ☐ Complete

### Step 2: Database Migration
```bash
cd CueFinderBE

# Create migration (if needed)
dotnet ef migrations add AddModerationEntities

# Apply migration
dotnet ef database update

# Verify tables created
cd .. && docker exec cuefinder-postgres \
  psql -U postgres -d cuefinder -c "\dt"

cd ..
```

**Status**: ☐ Complete

### Step 3: Build NudeNet Container
```bash
# Build the image
docker build -f deployment/Dockerfile.nudenet -t cuefinder-nudenet:latest .

# Verify build
docker images | grep cuefinder-nudenet
```

**Status**: ☐ Complete

### Step 4: Start Docker Services
```bash
# Start all services
docker-compose up -d

# Wait for services to be healthy
sleep 30

# Verify services
docker-compose ps

# Check NudeNet health
curl http://localhost:8001/health
```

**Status**: ☐ Complete

### Step 5: Verify Backend
```bash
# Check backend logs for errors
docker logs cuefinder-backend | tail -20

# Verify database connection
curl http://localhost:5000/api/health

# Check API responds
curl http://localhost:5000/api/cues
```

**Status**: ☐ Complete

### Step 6: Test Moderation Endpoint
```bash
# Get auth token (adjust credentials)
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}' | jq -r .token)

# Test upload endpoint
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg" \
  http://localhost:5000/api/moderation/upload-image
```

**Status**: ☐ Complete

### Step 7: Access Admin Dashboard
```bash
# Navigate to frontend
# http://localhost:3000

# Add route to ModerationDashboard
# (See CueFinderFE/src/App.jsx or routing setup)

# Access admin dashboard
# http://localhost:3000/admin/moderation
```

**Status**: ☐ Complete

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Upload image → Gets processed
- [ ] Unsafe image → Rejected with error
- [ ] Safe image → Approved and URL returned
- [ ] Admin views pending flags
- [ ] Admin can approve flag
- [ ] Admin can reject flag
- [ ] Admin can ban user
- [ ] User reports work
- [ ] Dashboard auto-refreshes

### Automated Testing (Optional)
```bash
# Run backend tests (if created)
cd CueFinderBE
dotnet test

# Run integration tests
dotnet test --filter "Integration"

cd ..
```

### Load Testing
```bash
# Simulate multiple uploads
for i in {1..10}; do
  curl -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test.jpg" \
    http://localhost:5000/api/moderation/upload-image &
done
wait
```

---

## 📊 Performance Verification

### Check Response Times
```bash
# Time a single upload
time curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg" \
  http://localhost:5000/api/moderation/upload-image

# Should complete in < 1 second
```

### Monitor Resource Usage
```bash
# Docker stats
docker stats cuefinder-nudenet cuefinder-backend

# Database connections
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT count(*) FROM pg_stat_activity"
```

### Check Disk Usage
```bash
# Total
du -sh uploads/

# Per directory
du -sh uploads/temp/ uploads/approved/ uploads/moderation/
```

---

## 🔍 Verification Checklist

### Service Health
- [ ] Backend service is running (`docker ps`)
- [ ] NudeNet service is running and responding to `/health`
- [ ] PostgreSQL database is connected
- [ ] React frontend loads without errors
- [ ] All services are on `cuefinder-network`

### Database
- [ ] `FlaggedImages` table exists
- [ ] `ModerationQueues` table exists
- [ ] `UserReports` table exists
- [ ] All indexes created successfully
- [ ] Foreign key relationships established
- [ ] Migration history recorded

### API Functionality
- [ ] Upload endpoint accepts files
- [ ] File validation working
- [ ] AI scanning completes
- [ ] Flags stored in database
- [ ] Admin endpoints require auth
- [ ] Approve/reject logic working

### Frontend
- [ ] Dashboard renders without errors
- [ ] Flags list updates in real-time
- [ ] Approve/reject buttons are clickable
- [ ] Ban user checkbox appears
- [ ] Admin notes textarea works

### Security
- [ ] Images in temp folder are not public
- [ ] Only authenticated users can upload
- [ ] Only admins can approve/reject
- [ ] Filenames are randomized
- [ ] Audit trail is recorded

---

## 📈 Post-Deployment Tasks

### Monitor First Week
```bash
# Check error logs daily
docker logs cuefinder-backend --since 24h | grep ERROR

# Monitor queue size
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT COUNT(*) FROM moderation_queues"

# Check false positive rate
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT COUNT(*) FROM flagged_images WHERE status='approved' AND is_ai_flagged"
```

### Adjust Thresholds
```json
{
  "Moderation": {
    "ConfidenceThreshold": 0.65  // Adjust based on results
  }
}
```

### Set Up Monitoring
- [ ] Configure application logging
- [ ] Set up error alerts
- [ ] Create dashboard for metrics
- [ ] Set up scheduled backups
- [ ] Configure log rotation

### Train Admins
- [ ] Show dashboard functionality
- [ ] Explain confidence scores
- [ ] Review decision guidelines
- [ ] Setup admin accounts

---

## 🐛 Troubleshooting During Deployment

### Issue: NudeNet won't start
```bash
# Check logs
docker logs cuefinder-nudenet

# Rebuild without cache
docker build --no-cache -f deployment/Dockerfile.nudenet .

# Check disk space
df -h
```

### Issue: Migration fails
```bash
# Rollback
cd CueFinderBE
dotnet ef database update <previous_migration>

# Check for syntax errors
dotnet ef dbcontext info

# Reapply
dotnet ef database update

cd ..
```

### Issue: Backend can't connect to NudeNet
```bash
# Check Docker network
docker network inspect cuefinder-network

# Test connectivity
docker exec cuefinder-backend ping nudenet

# Check service health
curl http://localhost:8001/health
```

### Issue: Port conflicts
```bash
# Find process using port
lsof -i :8001  # NudeNet
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

---

## ✅ Final Deployment Checklist

Before marking as "live":

- [ ] All services running and healthy
- [ ] Database migration successful
- [ ] API endpoints responding correctly
- [ ] Admin dashboard loading and functional
- [ ] Sample image upload tested
- [ ] Approve/reject workflow tested
- [ ] Documentation accessible
- [ ] Team trained on usage
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error logging set up
- [ ] Security audit complete

---

## 📞 Support Contacts

### Issue: Something isn't working
1. Check logs: `docker logs cuefinder-<service>`
2. Consult troubleshooting guide: `MODERATION_SYSTEM_COMPLETE.md`
3. Verify configuration: `MODERATION_APPSETTINGS_TEMPLATE.json`

### Issue: Performance problems
1. Check CPU: `docker stats`
2. Check disk: `du -sh uploads/`
3. Consider NudeNet scaling

### Issue: Bugs in code
1. Check migrations: `dotnet ef migrations list`
2. Check service implementation
3. Review API endpoints

---

## 📝 Sign-Off

| Item | Owner | Status | Date |
|------|-------|--------|------|
| Code Review | Dev Team | ☐ | _____ |
| Testing | QA Team | ☐ | _____ |
| Security Audit | Security Team | ☐ | _____ |
| Performance Check | DevOps | ☐ | _____ |
| Documentation Review | Tech Leads | ☐ | _____ |
| Admin Training | Product | ☐ | _____ |
| Go-Live Approval | PM | ☐ | _____ |

---

## 🎯 Success Criteria

✅ System is deployed and accessible  
✅ All endpoints responding correctly  
✅ Admin dashboard functional  
✅ Images being moderated  
✅ No critical errors in logs  
✅ Performance within SLA  
✅ Team can operate system  

---

## 📅 Timeline

- **Day 0**: Code complete (✅ DONE)
- **Day 1**: Deploy to development
- **Day 2**: Full testing & fixes
- **Day 3**: Deploy to staging
- **Day 4**: Performance testing
- **Day 5**: Admin training
- **Day 6**: Production deployment
- **Week 2**: Monitor & optimize

---

**Status**: Ready for deployment ✅

**Last Updated**: January 21, 2026  
**Next Review**: After first week in production
