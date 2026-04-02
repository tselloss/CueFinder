# Development Environment Setup

This guide will help you set up your local development environment for CueFinder.

## Prerequisites

### Required Software

- **Git** (2.37+)
- **.NET SDK** (8.0)
- **Node.js** (18+) and **pnpm** (8+)
- **PostgreSQL** (15+)
- **Docker Desktop** (for containerized development)
- **Visual Studio 2022** or **VS Code** (recommended IDEs)

### Optional Tools

- **pgAdmin 4** - PostgreSQL GUI management
- **Postman** - API testing
- **DBeaver** - Alternative database client

## Initial Setup

### 1. Clone the Repository

```powershell
git clone https://github.com/tselloss/CueFinder.git
cd CueFinder
```

### 2. Backend Setup

#### Install Dependencies

```powershell
cd CueFinderBE
dotnet restore
```

#### Configure Database

**Option A: Local PostgreSQL**

1. Install PostgreSQL 15+ locally
2. Create database:
```sql
CREATE DATABASE cuefinder;
CREATE USER postgres WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE cuefinder TO postgres;
```

3. Update `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=admin;SslMode=Disable;"
  }
}
```

**Option B: Docker PostgreSQL**

```powershell
docker run --name cuefinder-postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=cuefinder -p 5432:5432 -d postgres:15
```

#### Run Migrations

```powershell
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
```

#### Run Backend

```powershell
dotnet run
```

Backend will be available at: `https://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies

```powershell
cd CueFinderFE
pnpm install
```

#### Configure Environment

Create `.env.development` in `CueFinderFE/`:

```env
VITE_API_URL=https://localhost:5000
VITE_APP_NAME=CueFinder
```

#### Run Frontend

```powershell
pnpm dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Verify Setup

1. Navigate to `http://localhost:5173`
2. Create a test account
3. Try creating a listing
4. Check database for created records

## Docker Development

### Using Docker Compose

Run entire stack with Docker:

```powershell
docker-compose -f docker-compose.dev.yml up
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 5000
- Frontend on port 3000

### Individual Container Commands

```powershell
# Build backend image
docker build -t cuefinder-backend -f CueFinderBE/Dockerfile .

# Build frontend image
docker build -t cuefinder-frontend -f CueFinderFE/Dockerfile .

# Run backend container
docker run -d -p 5000:5000 --name cuefinder-api cuefinder-backend

# Run frontend container
docker run -d -p 3000:3000 --name cuefinder-web cuefinder-frontend
```

## Database Management

### Entity Framework Migrations

#### Create a New Migration

```powershell
cd CueFinderBE
dotnet ef migrations add MigrationName --project ../SolutionLibraries/CueFinder.Database
```

#### Apply Migrations

```powershell
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
```

#### Remove Last Migration

```powershell
dotnet ef migrations remove --project ../SolutionLibraries/CueFinder.Database
```

#### Generate SQL Script

```powershell
dotnet ef migrations script --project ../SolutionLibraries/CueFinder.Database --output migration.sql
```

### Database Seeding

Run seed scripts from `init.sql/` folder:

```powershell
psql -U postgres -d cuefinder -f init.sql/seed-forum-categories.sql
```

## Testing Setup

### Running Unit Tests

```powershell
# Run all unit tests
dotnet test tests/UnitTests/

# Run specific test project
dotnet test tests/UnitTests/CueFinder.Raffles.Tests/

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Running Integration Tests

Integration tests require PostgreSQL:

```powershell
# Start test database
docker run --name cuefinder-test-db -e POSTGRES_PASSWORD=test -e POSTGRES_DB=cuefinder_test -p 5433:5432 -d postgres:15

# Run integration tests
dotnet test tests/IntegrationTests/
```

## Environment Variables

### Backend (appsettings.Development.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=admin;SslMode=Disable;"
  },
  "JwtSettings": {
    "Secret": "your-development-secret-key-min-32-chars",
    "Issuer": "CueFinder",
    "Audience": "CueFinderUsers",
    "ExpirationMinutes": 60
  },
  "GoogleAuth": {
    "ClientId": "your-google-client-id",
    "ClientSecret": "your-google-client-secret"
  },
  "PasswordReset": {
    "ServerPepper": "dev-pepper-for-testing-only"
  },
  "ModerationServiceUrl": "http://localhost:5001"
}
```

### Frontend (.env.development)

```env
VITE_API_URL=https://localhost:5000
VITE_APP_NAME=CueFinder
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## IDE Configuration

### Visual Studio 2022

1. Open `CueFinderBE.sln`
2. Set `CueFinderBE` as startup project
3. Configure launch settings in `Properties/launchSettings.json`
4. Enable Hot Reload for faster development

### VS Code

Recommended extensions:
- C# Dev Kit
- .NET Runtime
- ESLint
- Prettier
- React Snippets
- Docker
- PostgreSQL

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch (web)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/CueFinderBE/bin/Debug/net8.0/CueFinderBE.dll",
      "args": [],
      "cwd": "${workspaceFolder}/CueFinderBE",
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  ]
}
```

## Common Issues

### Port Already in Use

```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

### Database Connection Failed

- Verify PostgreSQL is running: `pg_ctl status`
- Check connection string in appsettings
- Ensure database exists: `psql -U postgres -l`
- Check firewall rules

### Migration Errors

```powershell
# Reset database
dotnet ef database drop --project ../SolutionLibraries/CueFinder.Database
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
```

### pnpm Install Fails

```powershell
# Clear cache
pnpm store prune

# Delete node_modules and lock file
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml

# Reinstall
pnpm install
```

### CORS Errors

Ensure backend `Program.cs` has CORS configured for localhost:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCors", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

## Next Steps

- Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system design
- Check [DATABASE.md](DATABASE.md) for database schema details
- Read [TESTING.md](TESTING.md) for testing guidelines
- See [API.md](API.md) for API documentation

---

Last Updated: April 2, 2026
