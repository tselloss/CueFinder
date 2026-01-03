# Docker PostgreSQL Setup Status

## ✅ Completed

1. **PostgreSQL Container Running**
   - Image: postgres:16
   - Container: cuefinder-postgres
   - Port: 5432
   - Database: cuefinder
   - Auth Method: trust (no password required)

2. **Verify with Docker Command:**
   ```bash
   docker ps
   # Should show cuefinder-postgres running on 0.0.0.0:5432->5432/tcp
   ```

3. **Test Connection from Docker:**
   ```bash
   docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "SELECT 1;"
   # Returns: 1 (success)
   ```

4. **Backend Code Changes**
   - ✅ Updated to PostgreSQL (Npgsql provider)
   - ✅ Added database service registration in Program.cs
   - ✅ Updated appsettings.json with PostgreSQL connection string
   - ✅ Created initial EF Core migration
   - ✅ Build succeeds with 0 errors

## ⚠️ Current Issue

**Authentication Problem with EF Core migrations from Windows host:**
- Docker container uses `trust` authentication (no password needed)
- Connection string includes `Username=postgres` but no password
- Npgsql is still attempting SASL authentication which fails

## 🔧 Solution 1: Use Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: cuefinder-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cuefinder
      POSTGRES_INITDB_ARGS: "-c password_encryption=scram-sha-256"
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d cuefinder"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

**Run it:**
```bash
docker-compose up -d
```

**Update connection string:**
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;SslMode=Disable;"
```

## 🔧 Solution 2: Manual Docker Run with Password

```bash
docker rm -f cuefinder-postgres

docker run --name cuefinder-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cuefinder \
  -p 5432:5432 \
  -d postgres:16 \
  -c password_encryption=md5
```

**Update connection string:**
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;SslMode=Disable;"
```

## 🔧 Solution 3: Run Migrations from Inside Container

```bash
# Copy your project into the container
docker cp . cuefinder-postgres:/app

# Execute migrations inside container
docker exec -it cuefinder-postgres bash
cd /app/CueFinderBE
dotnet ef database update --project ../CueFinder.Database
```

## 📋 Quick Fix Steps

**Step 1: Update connection string to include password**

File: `appsettings.json`

```json
"DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;SslMode=Disable;"
```

**Step 2: Delete the current container and use one with password auth**

```bash
docker rm -f cuefinder-postgres

docker run --name cuefinder-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cuefinder \
  -p 5432:5432 \
  -d postgres:16
```

**Step 3: Run migrations**

```bash
cd CueFinderBE
dotnet ef database update --project ../CueFinder.Database
```

**Step 4: Run the application**

```bash
dotnet run
```

## Current Connection Status

**From Windows Host:**
```
Connection String: Host=localhost;Port=5432;Database=cuefinder;Username=postgres;SslMode=Disable;
Status: ❌ Authentication fails (container uses trust auth)
```

**From Docker Container:**
```
Command: docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "SELECT 1;"
Status: ✅ Works (returns 1)
```

## Docker Logs

```bash
docker logs cuefinder-postgres | tail -20
```

## Stop PostgreSQL

```bash
docker stop cuefinder-postgres
```

## Start PostgreSQL Again

```bash
docker start cuefinder-postgres
```

## Remove PostgreSQL Completely

```bash
docker rm -f cuefinder-postgres
docker volume prune  # Remove unused volumes
```

## Next Steps

1. Choose Solution 1, 2, or 3 above
2. Update the connection string with password if needed
3. Run: `dotnet ef database update --project ../CueFinder.Database`
4. Run: `dotnet run` to start the application

Your PostgreSQL database is **ready in Docker** - just need to fix the authentication config! 🐘
