# CueFinder Project - Claude AI Assistant Guide

## Project Overview

CueFinder is a comprehensive billiard equipment marketplace platform that connects buyers and sellers of pool cues, billiard tables, and accessories. The platform includes advanced features like auctions, raffles, user ratings, and a moderation system.

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0 (C#)
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: JWT tokens + OAuth 2.0 (Google, Apple)
- **Email**: SMTP with HTML templates
- **Image Storage**: Local file system with configurable upload paths
- **API**: RESTful endpoints under `/api` prefix

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State**: React hooks (useState, useEffect, useContext)
- **Styling**: Tailwind CSS + shadcn/ui components
- **i18n**: react-i18next (English, Greek)
- **HTTP**: Axios

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (reverse proxy, SSL termination)
- **CI/CD**: GitHub Actions
- **Deployment**: VPS (Ubuntu) with automated deploy scripts

## Project Structure

```
CueFinder/
├── CueFinderBE/                 # Main ASP.NET API
├── CueFinderModerator/          # Moderation dashboard API
├── CueFinderBookingBE/          # Future booking service (TBD)
├── CueFinderFE/
│   └── packages/app/            # Main React frontend
├── SolutionLibraries/           # Shared .NET libraries
│   ├── CueFinder.Auth/          # Authentication & authorization
│   ├── CueFinder.Database/      # EF Core models, context, migrations
│   └── CueFinder.Extensions/    # Email, utilities, helpers
├── docs/                        # Comprehensive documentation
├── tests/                       # Integration & E2E tests
├── scripts/                     # Deployment & utility scripts
└── migrations/                  # SQL migration scripts
```

## Coding Conventions & Architecture

### API Design
- All endpoints under `/api/[controller]` route pattern
- Use DTOs for request/response (in `Models/` folders)
- Return appropriate HTTP status codes (200, 400, 401, 404, 500)
- Log all errors with structured logging

### Authentication Flow
1. User logs in → JWT token issued (expires in 7 days)
2. Token stored in localStorage (frontend)
3. Protected routes require `[Authorize]` attribute
4. Google/Apple OAuth supported via external provider flow

### Database Patterns
- **Soft Deletes**: Used for listings, users (IsActive flag)
- **Audit Fields**: CreatedAt, UpdatedAt on most entities
- **Migrations**: EF Core migrations in `SolutionLibraries/CueFinder.Database/Migrations/`
- **Naming**: PascalCase for tables, camelCase for JSON

### Error Handling
- Centralized exception middleware in backend
- Try-catch blocks in controllers
- User-friendly error messages (never expose stack traces to clients)
- Detailed logging for debugging

## Key Features & Implementation

### Password Reset (Forgot Password)
- **Service**: `IPasswordResetService` in `CueFinder.Auth`
- **Flow**:
  1. User requests reset → email with token link sent
  2. Token is SHA-256 hashed before DB storage
  3. Token valid for 30 minutes (configurable)
  4. One-time use (IsUsed flag)
- **Security**: Rate limiting (5 attempts/60 min), uniform responses (prevent enumeration)
- **Endpoints**:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/validate-reset-token`
  - `POST /api/auth/reset-password`

### User Roles & Permissions
- **Roles**: User, Admin, Moderator
- **Admin**: Full platform control via admin-only endpoints
- **Moderator**: Review reported content, manage flags
- **User**: Standard marketplace operations

### Image Upload
- Upload endpoint: `POST /api/cues/upload-image` (and similar for tables, etc.)
- Stored in `uploads/` directory
- URL format: `/uploads/{filename}`
- Validation: max 5MB, allowed types (jpg, png, webp)

### Internationalization
- Backend: Response messages in English (frontend handles i18n)
- Frontend: `react-i18next` with `en.json` and `gr.json`
- Translation keys: namespaced (e.g., `auth.forgotPassword.title`)

## Development Workflow

### Running Locally
```powershell
# Backend
cd CueFinderBE
dotnet run

# Frontend
cd CueFinderFE/packages/app
npm install
npm run dev

# Docker (full stack)
docker-compose -f docker-compose.dev.yml up
```

### Database Migrations
```powershell
# Add new migration
cd SolutionLibraries/CueFinder.Database
dotnet ef migrations add MigrationName --startup-project ../../CueFinderBE

# Apply migrations
cd CueFinderBE
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
```

### Environment Variables
- Backend: `appsettings.json` + `appsettings.Development.json`
- Frontend: `.env` files (VITE_ prefix)
- Production: GitHub Secrets + VPS environment

## Common Commands

### Testing
```powershell
# Backend tests
dotnet test

# Frontend tests
npm run test

# E2E tests
node tests/SecurityTests/auth-penetration-tests.js
```

### Deployment
```powershell
# Production deployment (triggers GitHub Actions)
git push origin release

# Manual deployment
./deploy-production.sh
```

## Important Notes

### Security
- Never commit secrets or passwords
- Use environment variables for sensitive config
- Always hash passwords with BCrypt (workFactor: 12)
- Validate all user input server-side

### Performance
- Use indexes on foreign keys and frequently queried fields
- Eager load related entities with `.Include()` when needed
- Implement pagination for list endpoints (default 20 items)

### Code Quality
- Follow C# naming conventions (PascalCase for public, _camelCase for private)
- Use async/await for all I/O operations
- Add XML documentation comments for public APIs
- Keep controllers thin (logic in services)

## Documentation

Comprehensive docs available in `/docs` folder:
- `FORGOT_PASSWORD_IMPLEMENTATION_GUIDE.md` - Password reset feature
- `GOOGLE_OAUTH_SETUP.md` - OAuth integration
- `DATABASE.md` - Full database schema reference
- `DEPLOYMENT.md` - Production deployment guide

## Contact & Support

- Repository: tselloss/CueFinder
- Current Branch: release
- Environment: Production at billiardscuefinder.com

---

When making changes to this project:
1. Always check existing patterns in similar features
2. Run tests after changes
3. Update documentation if adding new features
4. Follow the established architecture
5. Ask clarifying questions if requirements are unclear
