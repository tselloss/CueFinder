# 🚀 Quick Reference: Test Containers

**Your Current Setup**: PostgreSQL is running on port 5432 ✅

---

## ⚡ Quick Commands

### Run All Unit Tests (No container needed)
```powershell
# Auth tests (38/38 passing ✅)
dotnet test tests/UnitTests/CueFinder.Auth.Tests/

# Database tests (56/56 passing ✅)
dotnet test tests/UnitTests/CueFinder.Database.Tests/
```

### Run Integration Tests (Uses your existing PostgreSQL container)
```powershell
# Your PostgreSQL is already running on port 5432!
# Just run the tests:
cd tests/IntegrationTests/CueFinder.Database.IntegrationTests
dotnet test
```

---

## 🐳 Your Current Containers

Based on `docker ps` output:

| Container | Status | Port | Notes |
|-----------|--------|------|-------|
| **cuefinder-postgres** | ✅ Running (healthy) | 5432 | Ready for tests! |
| **cuefinder-backend** | ✅ Running | 5000 | Backend API |
| **cuefinder-frontend** | ✅ Running | 3000 | Frontend UI |
| **cuefinder-pgadmin** | ✅ Running | 5050 | Database admin |

---

## 📝 Test Container Passwords

⚠️ **Important**: Your PostgreSQL uses **different passwords** for different contexts:

| Use Case | Password | Command |
|----------|----------|---------|
| **Docker Compose** | `admin` | Used by `cuefinder-postgres` |
| **Integration Tests** | `postgres` | Default in test configuration |

### If Integration Tests Fail - Set Password:
```powershell
# Tell tests to use "admin" password (matches your container)
$env:TEST_DB_PASSWORD="admin"
dotnet test tests/IntegrationTests/CueFinder.Database.IntegrationTests/
```

---

## 🎯 Common Test Scenarios

### ✅ Just Run Unit Tests
```powershell
# No setup needed - just run!
cd C:\Users\karac\source\repos\CueFinder
dotnet test tests/UnitTests/
```

### ✅ Run Integration Tests with Your Container
```powershell
# Set password to match your container
$env:TEST_DB_PASSWORD="admin"

# Run tests
cd tests/IntegrationTests/CueFinder.Database.IntegrationTests
dotnet test
```

### ✅ Verify PostgreSQL is Ready
```powershell
# Check container status
docker ps | Select-String postgres

# Test PostgreSQL connection
docker exec cuefinder-postgres pg_isready -U postgres
```

---

## 🔧 Container Management

### Start/Stop Your Containers
```powershell
# Stop all
docker-compose down

# Start all
docker-compose up -d

# Start only PostgreSQL
docker-compose up -d postgres

# Check status
docker-compose ps
```

### PostgreSQL Specific
```powershell
# Connect to PostgreSQL
docker exec -it cuefinder-postgres psql -U postgres -d cuefinder

# View tables
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\dt *.*"

# View logs
docker logs cuefinder-postgres
```

---

## 🚨 Quick Troubleshooting

### Problem: Integration tests can't connect

**Solution**: Set password to match your container
```powershell
$env:TEST_DB_PASSWORD="admin"
dotnet test
```

### Problem: Port 5432 already in use

**Solution**: You're already using it! Just set the password correctly
```powershell
# Check what's on port 5432
docker ps | Select-String postgres

# It's your cuefinder-postgres container - you're good! ✅
```

### Problem: Container not responding

**Solution**: Restart PostgreSQL
```powershell
docker restart cuefinder-postgres
Start-Sleep -Seconds 5
docker exec cuefinder-postgres pg_isready -U postgres
```

---

## ✅ Your Next Steps

### Option 1: Run Integration Tests Now
```powershell
# Set password
$env:TEST_DB_PASSWORD="admin"

# Navigate to tests
cd C:\Users\karac\source\repos\CueFinder\tests\IntegrationTests\CueFinder.Database.IntegrationTests

# Run tests
dotnet test
```

### Option 2: Run All Tests
```powershell
cd C:\Users\karac\source\repos\CueFinder

# Unit tests (no container)
dotnet test tests/UnitTests/CueFinder.Auth.Tests/
dotnet test tests/UnitTests/CueFinder.Database.Tests/

# Integration tests (uses container)
$env:TEST_DB_PASSWORD="admin"
dotnet test tests/IntegrationTests/CueFinder.Database.IntegrationTests/
```

---

## 📊 Your Test Status

| Test Suite | Status | Container Needed |
|------------|--------|------------------|
| Auth Unit Tests | ✅ 38/38 (100%) | ❌ No |
| Database Unit Tests | ✅ 56/56 (100%) | ❌ No |
| Integration Tests | ⏳ Ready to run | ✅ Yes (Port 5432) |

---

## 💡 Pro Tips

1. **Your container is already running** - No need to start anything!
2. **Use `admin` password** for integration tests to match your container
3. **Unit tests are fast** - No container needed, run anytime
4. **Integration tests are thorough** - Test with real PostgreSQL

---

## 🔗 More Information

- 📖 [Full Guide](HOW_TO_RUN_TEST_CONTAINERS.md) - Complete documentation
- ✅ [Test Status](TEST_FIXES_COMPLETE.md) - Latest test results
- 🗄️ [Database Setup](POSTGRESQL_SETUP_GUIDE.md) - PostgreSQL configuration

---

**Ready to test?** Your PostgreSQL is running and healthy! 🎉

Just set the password and run:
```powershell
$env:TEST_DB_PASSWORD="admin"
dotnet test tests/IntegrationTests/CueFinder.Database.IntegrationTests/
```
