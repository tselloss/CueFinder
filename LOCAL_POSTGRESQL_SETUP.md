# Local PostgreSQL Setup for CueFinder

## Quick Setup (Windows Installer)

### Step 1: Download PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Download **PostgreSQL 15** (recommended for compatibility)
3. Run the installer

### Step 2: During Installation

**Key Settings:**
- **Installation Directory**: `C:\Program Files\PostgreSQL\15` (default)
- **Port**: `5432` (default)
- **Username**: `postgres`
- **Password**: `postgres` (or your choice)
- **Locale**: `C` or `en_US` (default is fine)
- **Data Directory**: `C:\Program Files\PostgreSQL\15\data` (default)

**Components to Install:**
- ✅ PostgreSQL Server
- ✅ pgAdmin 4
- ✅ Command Line Tools
- ✅ Development Libraries

### Step 3: Verify Installation

Open PowerShell and run:

```powershell
psql --version
```

Should show: `psql (PostgreSQL) 15.x`

## Create Database

### Method 1: Using pgAdmin (GUI)

1. pgAdmin automatically opens after installation
2. Or go to: http://localhost:5050
3. Right-click **Databases** → **Create** → **Database**
4. Name: `cuefinder`
5. Click **Save**

### Method 2: Using Command Line (PowerShell)

```powershell
psql -U postgres -h localhost

# Then in the psql prompt:
CREATE DATABASE cuefinder;

# Verify
\l

# Exit
\q
```

## Update Connection String

Update `CueFinderBE\appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;SslMode=Disable;"
  }
}
```

⚠️ **Replace `postgres` password with YOUR password if you set a different one during installation!**

## Run Migrations

```powershell
cd C:\Users\karac\source\repos\CueFinder\CueFinderBE

# Create migration
dotnet ef migrations add InitialCreate --project ../CueFinder.Database

# Apply migration
dotnet ef database update --project ../CueFinder.Database
```

**Expected Output:**
```
Build started...
Build succeeded.
Done.
```

## Verify Database Was Created

```powershell
psql -U postgres -h localhost -d cuefinder

# List tables
\dt

# Should show 7 tables:
# - cueimages
# - cues
# - messages
# - ratings
# - savedcues
# - transactions
# - users

\q
```

## Test the Application

```powershell
cd C:\Users\karac\source\repos\CueFinder\CueFinderBE

dotnet run
```

You should see:
```
info: CueFinder.Database[0]
      Database initialized successfully
      
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7200
```

## Manage PostgreSQL Services

### Check if PostgreSQL is Running

```powershell
Get-Service | Where-Object {$_.Name -like "*post*"}
```

### Start PostgreSQL

```powershell
Start-Service postgresql-x64-15
```

### Stop PostgreSQL

```powershell
Stop-Service postgresql-x64-15
```

### Restart PostgreSQL

```powershell
Restart-Service postgresql-x64-15
```

## Access PostgreSQL

### psql Command Line

```bash
# Connect as postgres user
psql -U postgres -h localhost

# Connect to specific database
psql -U postgres -h localhost -d cuefinder

# Run query from command line
psql -U postgres -h localhost -d cuefinder -c "SELECT COUNT(*) FROM users;"
```

### pgAdmin Web Interface

1. Open browser: http://localhost:5050
2. Default login (might need to set password on first run)
3. Navigate to: **Servers** → **PostgreSQL 15** → **Databases** → **cuefinder**

## Quick Reference: Connection Strings

| Environment | Connection String |
|---|---|
| Local Dev | `Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;SslMode=Disable;` |
| Network Dev | `Host=192.168.1.100;Port=5432;Database=cuefinder;Username=postgres;Password=postgres;SslMode=Disable;` |
| Production | `Host=prod-db.example.com;Port=5432;Database=cuefinder;Username=postgres;Password=SecurePassword;SslMode=Require;` |

## Troubleshooting

### "connection refused" error

**Solution:** Check if PostgreSQL service is running
```powershell
Get-Service postgresql-x64-15 | Select-Object Status

# If stopped, start it
Start-Service postgresql-x64-15
```

### "password authentication failed"

**Solution:** Verify credentials in connection string
```powershell
# Test connection
psql -U postgres -h localhost -W
# Enter password when prompted
```

### "database 'cuefinder' does not exist"

**Solution:** Create the database
```powershell
psql -U postgres -h localhost -c "CREATE DATABASE cuefinder;"
```

### Migration fails with "relation does not exist"

**Solution:** Run migrations again
```powershell
cd CueFinderBE
dotnet ef database update --project ../CueFinder.Database
```

## Windows Installation Paths

After installation, PostgreSQL will typically be at:

```
C:\Program Files\PostgreSQL\15\
  ├── bin\          (executables like psql.exe)
  ├── data\         (database files)
  ├── lib\          (libraries)
  └── share\        (documentation)
```

## Environment Variables

PostgreSQL doesn't automatically add to PATH. To use `psql` from anywhere:

```powershell
# Add to system PATH (requires admin)
# Or use full path:
C:\Program Files\PostgreSQL\15\bin\psql.exe -U postgres
```

## Next Steps

1. ✅ Download and install PostgreSQL 15
2. ✅ Create `cuefinder` database
3. ✅ Update `appsettings.json` with correct password
4. ✅ Run: `dotnet ef database update --project ../CueFinder.Database`
5. ✅ Run: `dotnet run`
6. ✅ Test endpoints

## Summary

Your PostgreSQL is now:
- ✅ Installed locally on Windows
- ✅ Running as a Windows service
- ✅ Accessible via `psql` and `pgAdmin`
- ✅ Ready for EF Core migrations
- ✅ Ready for your CueFinder application

Let me know once you've installed PostgreSQL and I'll help you run the migrations! 🚀
