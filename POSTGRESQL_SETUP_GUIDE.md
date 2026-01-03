# PostgreSQL Setup Guide for CueFinder

## Overview

Your CueFinder application is now configured to use **PostgreSQL** instead of SQL Server.

**Converted:**
- ✅ NuGet package: `Npgsql.EntityFrameworkCore.PostgreSQL`
- ✅ Database functions: `GETUTCDATE()` → `NOW() AT TIME ZONE 'UTC'`
- ✅ Connection string format: PostgreSQL standard
- ✅ Build status: **Success** (0 errors, 0 warnings)

---

## Prerequisites

### Option 1: Install PostgreSQL Locally (Windows)

**Download and Install:**
1. Go to https://www.postgresql.org/download/windows/
2. Download PostgreSQL 16 (or latest)
3. Run the installer
4. During installation:
   - Username: `postgres`
   - Password: `postgres` (default, change in production!)
   - Port: `5432` (default)
   - Locale: `C` (default)

**Verify Installation:**
```powershell
psql --version
```

### Option 2: Docker (Recommended for Development)

**Install PostgreSQL via Docker:**

```bash
docker run --name cuefinder-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=cuefinder `
  -p 5432:5432 `
  -d postgres:16-alpine
```

**Verify Container:**
```bash
docker ps
```

---

## Connection String

Your current connection string in `appsettings.json`:

```json
"DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;"
```

**Connection String Components:**

| Component | Value | Description |
|-----------|-------|-------------|
| Host | `localhost` | PostgreSQL server address |
| Port | `5432` | PostgreSQL default port |
| Database | `cuefinder` | Database name (case-sensitive in Linux!) |
| Username | `postgres` | Default PostgreSQL user |
| Password | `postgres` | PostgreSQL user password |

### For Different Environments

**Development (Local):**
```
Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;
```

**Production (Azure):**
```
Host=cuefinder.postgres.database.azure.com;Port=5432;Database=cuefinder;Username=postgres@cuefinder;Password=YourSecurePassword;SSL Mode=Require;
```

**Production (AWS RDS):**
```
Host=cuefinder.c9akciq32.us-east-1.rds.amazonaws.com;Port=5432;Database=cuefinder;Username=postgres;Password=YourSecurePassword;
```

---

## Create Database

### Method 1: Using pgAdmin (GUI)

1. Open pgAdmin web interface (usually http://localhost:5050)
2. Login with default credentials (usually postgres/postgres)
3. Right-click "Databases" → "Create" → "Database"
4. Enter name: `cuefinder`
5. Click "Save"

### Method 2: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE cuefinder;

# Verify
\l

# Exit
\q
```

### Method 3: Using Azure Data Studio

1. Download and install Azure Data Studio
2. Connect to PostgreSQL
3. Run SQL command:
```sql
CREATE DATABASE cuefinder;
```

---

## Create Database Schema (Migrations)

### Option 1: Already Have Migrations Created

If you already created migrations in SQL Server:

```bash
cd C:\Users\karac\source\repos\CueFinder\CueFinderBE

# Remove old SQL Server migration (if needed)
# dotnet ef migrations remove

# Create fresh PostgreSQL migration
dotnet ef migrations add InitialPostgresCreate --project ../CueFinder.Database

# Apply migration
dotnet ef database update --project ../CueFinder.Database
```

### Option 2: Fresh Start

```bash
cd C:\Users\karac\source\repos\CueFinder\CueFinderBE

# Create initial migration
dotnet ef migrations add InitialCreate --project ../CueFinder.Database

# Apply to database
dotnet ef database update --project ../CueFinder.Database
```

**Expected Output:**
```
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (42ms) [Parameters=[], CommandType='Text']
      CREATE TABLE "users" (
        "id" serial PRIMARY KEY,
        "username" text NOT NULL UNIQUE,
        ...
      )

Done. Successful update.
```

---

## Verify Database Creation

### Using psql

```bash
psql -U postgres -h localhost -d cuefinder

# List tables
\dt

# Describe users table
\d users

# Exit
\q
```

**Expected Tables:**
```
             List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | cueimages     | table | postgres
 public | cues          | table | postgres
 public | messages      | table | postgres
 public | ratings       | table | postgres
 public | savedcues     | table | postgres
 public | transactions  | table | postgres
 public | users         | table | postgres
```

### Using pgAdmin

1. Connect to database
2. Expand `cuefinder` database
3. Expand `Schemas` → `public` → `Tables`
4. You should see all 7 tables

---

## Run the Application

```bash
cd C:\Users\karac\source\repos\CueFinder\CueFinderBE

dotnet run
```

**Expected Output:**
```
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (123ms) [Parameters=[], CommandType='Text']
      SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users')
      
info: CueFinder.Database[0]
      Database initialized successfully
      
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7200
```

---

## Test Endpoints

### Register a User

```bash
curl -X POST https://localhost:7200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "555-9999"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1,
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "phone": "555-9999",
  "role": "user",
  "expiresIn": 3600
}
```

### Check Database

```bash
psql -U postgres -h localhost -d cuefinder

SELECT * FROM users;
```

You should see your newly registered user!

---

## Database Tools

### pgAdmin (GUI Management)

**Install:**
1. Download from https://www.pgadmin.org/download/
2. Create server with:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: postgres

**Features:**
- Create/drop databases
- Run SQL queries
- View table data
- Manage users/permissions
- Monitor queries

### Azure Data Studio

**Install:**
1. Download from https://docs.microsoft.com/en-us/sql/azure-data-studio/
2. Install PostgreSQL extension
3. Connect with same credentials

### CLI (psql)

**Common Commands:**
```bash
# Connect
psql -U postgres -h localhost -d cuefinder

# List databases
\l

# Connect to database
\c cuefinder

# List tables
\dt

# Describe table
\d users

# Query table
SELECT * FROM users;

# Execute file
\i /path/to/script.sql

# Exit
\q
```

---

## Useful SQL Queries

### Check User Counts

```sql
SELECT COUNT(*) as total_users FROM users;
```

### Check All Registered Users

```sql
SELECT id, username, email, created_at FROM users;
```

### Check Database Size

```sql
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'cuefinder';
```

### List All Indexes

```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public';
```

### Check Active Connections

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'cuefinder';
```

---

## Troubleshooting

### Error: "could not connect to server"

**Solution:** Check if PostgreSQL is running
```bash
# Windows - Check if service is running
Get-Service | Select-String postgres

# Docker - Check if container is running
docker ps
```

### Error: "FATAL: Ident authentication failed"

**Solution:** Verify username/password in connection string
```bash
psql -U postgres -h localhost -W
# Enter password: postgres
```

### Error: "database 'cuefinder' does not exist"

**Solution:** Create the database
```bash
psql -U postgres -h localhost -c "CREATE DATABASE cuefinder;"
```

### Error: Migration fails with "already exists"

**Solution:** Drop and recreate the migration
```bash
# Remove last migration
dotnet ef migrations remove --project ../CueFinder.Database

# Create new one
dotnet ef migrations add InitialPostgres --project ../CueFinder.Database

# Apply
dotnet ef database update --project ../CueFinder.Database
```

### Error: "relation 'users' does not exist"

**Solution:** Apply migrations
```bash
cd CueFinderBE
dotnet ef database update --project ../CueFinder.Database
```

---

## Production Considerations

### Security

✅ **Change default password:**
```bash
psql -U postgres -h localhost
ALTER USER postgres WITH PASSWORD 'StrongPassword123!';
\q
```

✅ **Update connection string in production:**
```json
"DefaultConnection": "Host=your-prod-host.com;Port=5432;Database=cuefinder;Username=prod_user;Password=ProducionSecurePassword;SSL Mode=Require;"
```

✅ **Create dedicated database user:**
```sql
CREATE USER cuefinder_user WITH PASSWORD 'UserPassword123!';
GRANT ALL PRIVILEGES ON DATABASE cuefinder TO cuefinder_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cuefinder_user;
```

### Backups

```bash
# Full backup
pg_dump -U postgres -h localhost cuefinder > cuefinder_backup.sql

# Restore backup
psql -U postgres -h localhost -d cuefinder < cuefinder_backup.sql
```

### Monitoring

```bash
# Check slow queries (add to postgresql.conf)
log_min_duration_statement = 1000  # Log queries > 1 second

# Check query plans
EXPLAIN ANALYZE SELECT * FROM users;
```

---

## What Changed From SQL Server

| Feature | SQL Server | PostgreSQL |
|---------|-----------|-----------|
| Connection | `Server=.;Database=...;Integrated Security=true;` | `Host=localhost;Port=5432;Database=...;Username=...;` |
| DateTime Default | `GETUTCDATE()` | `NOW() AT TIME ZONE 'UTC'` |
| Identity Columns | `IDENTITY(1,1)` | `SERIAL` (automatic) |
| NuGet Package | `Microsoft.EntityFrameworkCore.SqlServer` | `Npgsql.EntityFrameworkCore.PostgreSQL` |
| Case Sensitivity | Insensitive (default) | Sensitive (depends on collation) |
| Schemas | DBO | public |

---

## Build Status

✅ **Build: SUCCESS**
- 0 Errors
- 0 Warnings
- All projects compiled

✅ **Packages:**
- Npgsql.EntityFrameworkCore.PostgreSQL v8.0.0
- Microsoft.EntityFrameworkCore v8.0.0
- Microsoft.EntityFrameworkCore.Tools v8.0.0

✅ **Application Ready:** Yes

---

## Next Steps

1. ✅ Install PostgreSQL (local or Docker)
2. ✅ Create `cuefinder` database
3. ✅ Run migrations: `dotnet ef database update`
4. ✅ Start application: `dotnet run`
5. ✅ Test endpoints with curl or Postman
6. ✅ Verify data in pgAdmin

Your CueFinder application is now **fully configured for PostgreSQL**! 🚀
