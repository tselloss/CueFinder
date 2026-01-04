# CueFinder Integration Tests with Docker PostgreSQL

## Overview

Integration tests use a real PostgreSQL database running in Docker to ensure that database operations work correctly with actual database constraints, transactions, and concurrency.

## Prerequisites

- Docker Desktop installed and running
- .NET 8 SDK
- PostgreSQL client tools (optional, for manual verification)

## Test Database Configuration

**Connection Details:**
- Host: localhost
- Port: 5433 (to avoid conflict with main database on 5432)
- Database: cuefinder_test (unique per test run)
- Username: postgres
- Password: postgres

## Running Integration Tests

### Option 1: Run Integration Tests Only
```powershell
cd tests
.\run-integration-tests.ps1
```

This script will:
1. Check if Docker is running
2. Start the test PostgreSQL container
3. Wait for database to be ready
4. Run Database integration tests
5. Run Auth integration tests
6. Stop and remove the test container
7. Display test summary

### Option 2: Run All Tests (Unit + Integration)
```powershell
cd tests
.\run-all-tests.ps1
```

This script will:
1. Run all unit tests
2. Run all integration tests with Docker
3. Display complete test summary

### Option 3: Manual Test Execution

Start the test database:
```powershell
cd tests
docker-compose -f docker-compose.test.yml up -d
```

Run specific integration tests:
```powershell
# Database integration tests
dotnet test IntegrationTests/CueFinder.Database.IntegrationTests/CueFinder.Database.IntegrationTests.csproj

# Auth integration tests
dotnet test IntegrationTests/CueFinder.Auth.IntegrationTests/CueFinder.Auth.IntegrationTests.csproj
```

Stop the test database:
```powershell
docker-compose -f docker-compose.test.yml down -v
```

## Test Structure

### Database Integration Tests
Located in: `IntegrationTests/CueFinder.Database.IntegrationTests/`

Tests include:
- ✅ Complete user lifecycle (create, update, delete)
- ✅ Complete cue lifecycle with real foreign keys
- ✅ PostgreSQL full-text search
- ✅ Pagination with real data
- ✅ Concurrent operations and database locking
- ✅ Active/sold cue filtering

### Auth Integration Tests
Located in: `IntegrationTests/CueFinder.Auth.IntegrationTests/`

Tests include:
- ✅ Full authentication flow (register → login → profile → update)
- ✅ Password hashing and verification
- ✅ Email-based login
- ✅ Duplicate username/email detection
- ✅ Inactive user rejection
- ✅ Last login timestamp tracking

## Test Isolation

Each test class creates a unique database with a GUID-based name (e.g., `cuefinder_test_a1b2c3d4...`). This ensures:
- Tests can run in parallel
- No interference between test classes
- Clean slate for each test run
- Automatic cleanup after tests complete

## Environment Variables

You can override default database connection settings:

```powershell
$env:TEST_DB_HOST = "localhost"
$env:TEST_DB_PORT = "5433"
$env:TEST_DB_USER = "postgres"
$env:TEST_DB_PASSWORD = "postgres"
```

## Troubleshooting

### Docker is not running
```
Error: Docker is not running. Please start Docker Desktop.
```
**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Port 5433 already in use
```
Error: Cannot start service postgres-test: Ports are not available
```
**Solution:** 
1. Check if another container is using port 5433: `docker ps`
2. Stop the conflicting container or change the port in `docker-compose.test.yml`

### Database connection timeout
```
Error: Unable to connect to the database
```
**Solution:**
1. Check Docker container logs: `docker logs cuefinder-postgres-test`
2. Ensure the container is running: `docker ps`
3. Wait longer for database initialization

### Tests fail with "relation does not exist"
```
Error: 42P01: relation "users" does not exist
```
**Solution:** 
1. Ensure migrations are being applied (DatabaseTestBase calls `EnsureCreated()`)
2. Check that the database context is properly configured

### Clean up hanging containers
```powershell
# List all test containers
docker ps -a | findstr cuefinder-postgres-test

# Remove test containers
docker rm -f cuefinder-postgres-test

# Remove test volumes
docker volume ls | findstr postgres_test
docker volume rm cuefinder_postgres_test_data
```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
- name: Start test database
  run: |
    cd tests
    docker-compose -f docker-compose.test.yml up -d
    
- name: Wait for database
  run: |
    timeout 30 bash -c 'until docker exec cuefinder-postgres-test pg_isready -U postgres; do sleep 1; done'
    
- name: Run integration tests
  run: |
    cd tests
    dotnet test IntegrationTests/CueFinder.Database.IntegrationTests
    dotnet test IntegrationTests/CueFinder.Auth.IntegrationTests
    
- name: Stop test database
  if: always()
  run: |
    cd tests
    docker-compose -f docker-compose.test.yml down -v
```

## Benefits of Docker-based Integration Tests

1. **Real Database Behavior**: Tests against actual PostgreSQL, not in-memory simulation
2. **Foreign Key Constraints**: Tests verify referential integrity
3. **Transaction Handling**: Tests verify proper transaction management
4. **Concurrency**: Tests verify database locking and concurrent operations
5. **Full-Text Search**: Tests verify PostgreSQL-specific features
6. **Performance**: Tests realistic query performance
7. **Migrations**: Tests verify Entity Framework migrations work correctly

## Comparison: In-Memory vs Docker PostgreSQL

| Aspect | In-Memory (SQLite) | Docker PostgreSQL |
|--------|-------------------|-------------------|
| Speed | Faster | Slightly slower |
| Setup | Simple | Requires Docker |
| Realism | Limited | Full PostgreSQL features |
| Foreign Keys | Limited support | Full support |
| Full-Text Search | Not supported | Native support |
| Concurrency | Limited | Real locks |
| CI/CD | Easy | Requires Docker |
| **Recommendation** | Unit tests | Integration tests |

## Related Documentation

- [Test Project Structure](README.md)
- [Unit Tests Guide](README.md#unit-tests)
- [Main Documentation](../DOCUMENTATION_INDEX.md)
