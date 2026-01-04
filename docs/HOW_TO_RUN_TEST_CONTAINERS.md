# 🐳 How to Run Test Containers

Complete guide for running containers for testing in CueFinder project.

**Date**: January 4, 2026

---

## 🎯 Quick Start

### Option 1: Run PostgreSQL for Integration Tests (Recommended)

```powershell
# Start PostgreSQL container for tests
docker run --name cuefinder-postgres-test `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=cuefinder `
    -p 5432:5432 `
    -d postgres:15
```

### Option 2: Use Existing PostgreSQL Container

```powershell
# Check if container exists and is running
docker ps -a | Select-String postgres

# Start existing container
docker start cuefinder-postgres

# Verify it's running
docker ps | Select-String postgres
```

### Option 3: Use Docker Compose (All Services)

```powershell
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# Or just PostgreSQL
docker-compose up -d postgres
```

---

## 📋 Complete Guide

### 1️⃣ Check Docker Status

```powershell
# Check if Docker is running
docker --version

# List all containers
docker ps -a

# List running containers only
docker ps
```

### 2️⃣ Start PostgreSQL for Tests

#### For Integration Tests (Port 5432)

```powershell
# Create and start PostgreSQL container
docker run --name cuefinder-postgres-test `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=cuefinder `
    -p 5432:5432 `
    -d postgres:15-alpine

# Wait for PostgreSQL to be ready
Start-Sleep -Seconds 5

# Verify it's ready
docker exec cuefinder-postgres-test pg_isready -U postgres
```

#### Check Container Status

```powershell
# Check if running
docker ps | Select-String postgres

# View logs
docker logs cuefinder-postgres-test

# Check health
docker exec cuefinder-postgres-test pg_isready -U postgres
```

### 3️⃣ Run Tests

#### A. Unit Tests (No container needed)

```powershell
# Auth tests
cd tests/UnitTests/CueFinder.Auth.Tests
dotnet test

# Database tests
cd tests/UnitTests/CueFinder.Database.Tests
dotnet test

# All unit tests
dotnet test tests/UnitTests/
```

#### B. Integration Tests (Requires PostgreSQL container)

```powershell
# Make sure PostgreSQL is running on port 5432
docker ps | Select-String postgres

# Run integration tests
cd tests/IntegrationTests/CueFinder.Database.IntegrationTests
dotnet test

# Or with environment variables
$env:TEST_DB_HOST="localhost"
$env:TEST_DB_PORT="5432"
$env:TEST_DB_USER="postgres"
$env:TEST_DB_PASSWORD="postgres"
dotnet test
```

#### C. E2E Tests (Requires all services)

```powershell
# Use the E2E test runner script
.\run-e2e-tests.ps1

# Or manually start all services
docker-compose up -d
npm test --prefix CueFinderFE/cuefinderfe
```

---

## 🔧 Container Configuration

### Default PostgreSQL Configuration

| Setting | Value |
|---------|-------|
| **Host** | localhost |
| **Port** | 5432 |
| **Database** | cuefinder |
| **User** | postgres |
| **Password** | postgres (for tests) / admin (for development) |

### Environment Variables for Tests

```powershell
# Set these before running integration tests
$env:TEST_DB_HOST="localhost"      # Default: localhost
$env:TEST_DB_PORT="5432"           # Default: 5432
$env:TEST_DB_USER="postgres"       # Default: postgres
$env:TEST_DB_PASSWORD="postgres"   # Default: postgres
```

---

## 📝 Common Commands

### Container Management

```powershell
# Start container
docker start cuefinder-postgres-test

# Stop container
docker stop cuefinder-postgres-test

# Restart container
docker restart cuefinder-postgres-test

# Remove container (will delete data)
docker rm -f cuefinder-postgres-test

# View container logs
docker logs cuefinder-postgres-test

# Follow logs in real-time
docker logs -f cuefinder-postgres-test
```

### Database Management

```powershell
# Connect to PostgreSQL
docker exec -it cuefinder-postgres-test psql -U postgres -d cuefinder

# List databases
docker exec cuefinder-postgres-test psql -U postgres -c "\l"

# List tables
docker exec cuefinder-postgres-test psql -U postgres -d cuefinder -c "\dt *.*"

# Run SQL query
docker exec cuefinder-postgres-test psql -U postgres -d cuefinder -c "SELECT * FROM public.users;"
```

### Docker Compose Commands

```powershell
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs postgres

# Check status
docker-compose ps
```

---

## 🧪 Test Scenarios

### Scenario 1: Run Unit Tests Only

**No container needed!**

```powershell
# Navigate to project root
cd C:\Users\karac\source\repos\CueFinder

# Run all unit tests
dotnet test tests/UnitTests/CueFinder.Auth.Tests/
dotnet test tests/UnitTests/CueFinder.Database.Tests/
```

**Result**: ✅ 94/94 tests passing (100%)

---

### Scenario 2: Run Integration Tests

**Requires PostgreSQL container**

```powershell
# Step 1: Start PostgreSQL container
docker run --name cuefinder-postgres-test `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=cuefinder `
    -p 5432:5432 `
    -d postgres:15

# Step 2: Wait for ready
Start-Sleep -Seconds 5

# Step 3: Verify PostgreSQL is ready
docker exec cuefinder-postgres-test pg_isready -U postgres

# Step 4: Run integration tests
cd tests/IntegrationTests/CueFinder.Database.IntegrationTests
dotnet test
```

---

### Scenario 3: Run E2E Tests

**Requires all services (PostgreSQL, Backend, Frontend)**

```powershell
# Option A: Use the script
.\run-e2e-tests.ps1

# Option B: Manual setup
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Start Backend
cd CueFinderBE
dotnet run &

# 3. Start Frontend
cd ../CueFinderFE/cuefinderfe
npm start &

# 4. Run E2E tests
npm test
```

---

## 🚨 Troubleshooting

### Problem: Container won't start

```powershell
# Check if port 5432 is already in use
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue

# Stop any conflicting containers
docker stop $(docker ps -q --filter "publish=5432")

# Remove old container and start fresh
docker rm -f cuefinder-postgres-test
docker run --name cuefinder-postgres-test -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cuefinder -p 5432:5432 -d postgres:15
```

### Problem: Tests can't connect to database

```powershell
# Verify container is running
docker ps | Select-String postgres

# Check PostgreSQL is accepting connections
docker exec cuefinder-postgres-test pg_isready -U postgres

# Test connection manually
docker exec -it cuefinder-postgres-test psql -U postgres -d cuefinder -c "SELECT 1;"

# Check environment variables
Write-Host "Host: $env:TEST_DB_HOST"
Write-Host "Port: $env:TEST_DB_PORT"
Write-Host "User: $env:TEST_DB_USER"
```

### Problem: Integration tests fail

```powershell
# Make sure using correct password
# Default for tests: "postgres"
# Default for docker-compose: "admin"

# Set the correct password
$env:TEST_DB_PASSWORD="postgres"

# Or use the docker-compose container
$env:TEST_DB_PASSWORD="admin"
docker start cuefinder-postgres
dotnet test
```

### Problem: Container exists but won't start

```powershell
# Remove and recreate
docker rm -f cuefinder-postgres-test

# Create new container
docker run --name cuefinder-postgres-test `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=cuefinder `
    -p 5432:5432 `
    -d postgres:15
```

---

## 📚 Integration Test Details

### How Integration Tests Work

1. **Test Base Class**: `DatabaseTestBase.cs`
   - Creates unique database for each test class
   - Lazy initialization (connects only when test runs)
   - Auto-cleanup after tests

2. **Connection String**:
   ```
   Host=localhost;
   Port=5432;
   Database=cuefinder_test_{guid};
   Username=postgres;
   Password=postgres
   ```

3. **Test Flow**:
   ```
   Test Starts → InitializeDatabase() → Create Unique DB 
   → Run Test → Dispose() → Drop Test DB
   ```

### Current Integration Tests

Located in: `tests/IntegrationTests/CueFinder.Database.IntegrationTests/`

**Tests** (8 total):
1. `CompleteUserLifecycle_CreateUpdateDelete_WorksCorrectly`
2. `CompleteCueLifecycle_WithMarkAsSold_WorksCorrectly`
3. `UserCueRelationship_ForeignKey_WorksCorrectly`
4. `PostgresFullTextSearch_OnCues_WorksCorrectly`
5. `ActiveVsSoldCues_Filtering_WorksCorrectly`
6. `Pagination_WithLargeDataset_WorksCorrectly`
7. `ConcurrentOperations_HandleCorrectly`
8. `TransactionRollback_OnError_WorksCorrectly`

---

## 🎯 Best Practices

### For Development

```powershell
# Use docker-compose for full stack
docker-compose up -d

# Check logs
docker-compose logs -f
```

### For Unit Tests

```powershell
# No container needed - just run
dotnet test tests/UnitTests/
```

### For Integration Tests

```powershell
# Start lightweight PostgreSQL container
docker run --name test-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine

# Run tests
dotnet test tests/IntegrationTests/

# Cleanup after
docker stop test-db && docker rm test-db
```

### For CI/CD

```yaml
# Example GitHub Actions workflow
- name: Start PostgreSQL
  run: |
    docker run --name test-db \
      -e POSTGRES_PASSWORD=postgres \
      -p 5432:5432 \
      -d postgres:15-alpine
    sleep 5

- name: Run Integration Tests
  run: dotnet test tests/IntegrationTests/
  env:
    TEST_DB_PASSWORD: postgres
```

---

## 📊 Test Summary

| Test Type | Container Required | Port | Duration |
|-----------|-------------------|------|----------|
| **Unit Tests** | ❌ No | - | < 2 seconds |
| **Integration Tests** | ✅ PostgreSQL | 5432 | ~5-10 seconds |
| **E2E Tests** | ✅ All services | 3000, 5000, 5432 | ~30-60 seconds |

---

## 🔗 Related Documentation

- [Test Results](TEST_FIXES_COMPLETE.md) - Latest test status (100% ✅)
- [Integration Tests README](INTEGRATION_TESTS_README.md) - Detailed integration test guide
- [Docker PostgreSQL Status](DOCKER_POSTGRESQL_STATUS.md) - Docker setup details
- [PostgreSQL Setup Guide](POSTGRESQL_SETUP_GUIDE.md) - Database configuration

---

## ✅ Quick Checklist

Before running integration tests:

- [ ] Docker Desktop is running
- [ ] Port 5432 is available
- [ ] PostgreSQL container is started
- [ ] Container is healthy (`pg_isready` returns success)
- [ ] Environment variables are set (if needed)

---

## 🎉 Success Indicators

### Container is Ready ✅
```powershell
PS> docker ps | Select-String postgres
cuefinder-postgres-test   postgres:15   Up 2 minutes   0.0.0.0:5432->5432/tcp
```

### PostgreSQL is Ready ✅
```powershell
PS> docker exec cuefinder-postgres-test pg_isready -U postgres
/var/run/postgresql:5432 - accepting connections
```

### Tests Pass ✅
```powershell
PS> dotnet test
Passed!  - Failed:     0, Passed:    8, Skipped:     0, Total:    8
```

---

*For more information, see the [Documentation Index](INDEX.md)*
