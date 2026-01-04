# CueFinder - Billiard Cue Marketplace

A full-stack web application for buying and selling premium billiard cues. Built with .NET 8, React, TypeScript, and PostgreSQL.

## What Does This App Do?

CueFinder is a marketplace platform that connects billiard enthusiasts who want to buy and sell pool cues. Users can browse listings, view detailed cue information, create their own listings, manage their profile, and communicate with sellers.

### Key Features

- **Browse & Search Cues**: View pool cue listings with images, pricing, condition, and seller information
- **User Authentication**: Secure JWT-based registration and login system with phone verification (SMS/Viber)
- **Create Listings**: Post your cues for sale with multiple images, detailed descriptions, and pricing
- **User Profiles**: Manage your account information, view your listings, and edit your profile
- **Admin Panel**: Administrative dashboard for managing users and listings
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Image Carousel**: Browse multiple images for each cue listing
- **Grid & List Views**: Switch between different viewing modes for the marketplace

---

## Frontend (React + TypeScript)

**Location**: `CueFinderFE/cuefinderfe/`

### Technology Stack
- React 18
- TypeScript
- TailwindCSS for styling
- Axios for API communication
- JWT token-based authentication

### Main Components

1. **LoginPage** - User authentication and registration
2. **CueList** - Grid/List view of all cue listings with search and filtering
3. **CueDetail** - Detailed view of a single cue with image carousel
4. **CueForm** - Form for creating new cue listings
5. **UserProfile** - User profile management and editing
6. **AdminPage** - Admin dashboard for managing users and cues

### API Integration

The frontend communicates with the backend through REST API endpoints:
- `/api/auth/*` - Authentication endpoints (login, register, phone verification)
- `/api/cues/*` - Cue CRUD operations
- `/api/users/*` - User profile management
- `/api/admin/*` - Admin operations

### Configuration

Environment variables (`.env.development`):
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Run Frontend

```bash
cd CueFinderFE/cuefinderfe
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## Backend (.NET 8)

**Location**: `CueFinderBE/`

### Technology Stack
- .NET 8.0 Web API
- Entity Framework Core
- PostgreSQL database
- JWT Authentication
- Phone verification (SMS/Viber via Twilio)

### Architecture

The backend follows a clean, modular architecture with separate libraries:

**SolutionLibraries/**
- `CueFinder.Auth/` - Authentication services, JWT token management, phone verification
- `CueFinder.Database/` - Database context, repositories, and data services
- `CueFinder.Models/` - Shared domain models (User, Cue, Rating, etc.)

### Main Controllers

1. **AuthController** - User registration, login, JWT token generation
2. **PhoneVerificationController** - SMS/Viber verification codes
3. **CuesController** - CRUD operations for cue listings
4. **UsersController** - User profile management
5. **AdminController** - Administrative operations

### Database Models

- **User** - User accounts with authentication details
- **Cue** - Pool cue listings with images, pricing, seller info
- **CueImage** - Multiple images per cue
- **Rating** - User ratings and reviews
- **PhoneVerification** - Phone verification tokens

### Key Features

- JWT token authentication with refresh tokens
- Phone number verification (SMS/Viber)
- Role-based authorization (User/Admin)
- Entity Framework migrations for database schema
- Repository pattern for data access
- Service layer for business logic

### Configuration

`appsettings.json`:
- Database connection string (PostgreSQL)
- JWT settings (secret key, expiration)
- SMS provider configuration (Twilio)
- CORS settings for frontend

### Run Backend

```bash
cd CueFinderBE
dotnet restore
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
dotnet run
```

Backend API runs on: `http://localhost:5000`

---

## Docker Setup

**File**: `docker-compose.yml`

The application is fully containerized with three main services:

### Services

1. **postgres** (PostgreSQL 15)
   - Container: `cuefinder-postgres`
   - Port: `5432`
   - Database: `cuefinder`
   - Credentials: `postgres` / `admin`
   - Health checks enabled
   - Persistent data volume

2. **pgadmin** (Database Management UI)
   - Container: `cuefinder-pgadmin`
   - Port: `5050` (access at http://localhost:5050)
   - Login: `admin@cuefinder.com` / `admin`
   - Web-based PostgreSQL management interface

3. **backend** (.NET API)
   - Container: `cuefinder-backend`
   - Port: `5000`
   - Dockerfile: `CueFinderBE/Dockerfile`
   - Auto-connects to PostgreSQL
   - Environment variables configured for database, JWT, SMS

4. **frontend** (React App)
   - Container: `cuefinder-frontend`
   - Port: `3000`
   - Dockerfile: `CueFinderFE/cuefinderfe/Dockerfile`
   - Connects to backend API

### Run Everything with Docker

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker logs cuefinder-backend
docker logs cuefinder-frontend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Network Architecture

All services communicate on the `cuefinder-network` bridge network:
- Frontend → Backend API (http://backend:5000)
- Backend → PostgreSQL (Host: cuefinder-postgres:5432)
- Developer → All services via exposed ports

### Volumes

- `postgres_data` - Persistent PostgreSQL database
- `pgadmin_data` - pgAdmin configuration and settings

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/tselloss/CueFinder.git
cd CueFinder

# Start everything
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# pgAdmin: http://localhost:5050
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL
docker-compose up postgres -d

# 2. Run Backend
cd CueFinderBE
dotnet restore
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
dotnet run

# 3. Run Frontend (in new terminal)
cd CueFinderFE/cuefinderfe
npm install
npm start
```

---

## Testing

The project includes comprehensive unit tests:

```bash
cd tests
dotnet test
```

Test coverage includes:
- Authentication services
- User management
- Cue CRUD operations
- Repository layer
- Phone verification

---

## Project Structure

```
CueFinder/
├── CueFinderBE/              # Backend API (.NET 8)
│   ├── Controllers/          # API endpoints
│   ├── Data/                 # Database context
│   ├── Dockerfile            # Backend container
│   └── appsettings.json      # Configuration
│
├── CueFinderFE/              # Frontend (React)
│   └── cuefinderfe/
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── api/          # API services
│       │   ├── auth/         # Auth context
│       │   └── App.js        # Main app
│       ├── Dockerfile        # Frontend container
│       └── package.json
│
├── SolutionLibraries/        # Shared backend libraries
│   ├── CueFinder.Auth/       # Authentication & JWT
│   ├── CueFinder.Database/   # EF Core & repositories
│   └── CueFinder.Models/     # Domain models
│
├── Models/                   # Shared models
├── tests/                    # Unit tests
├── docker-compose.yml        # Container orchestration
└── README.md                 # This file
```

---

## Technologies Used

### Backend
- .NET 8.0 Web API
- Entity Framework Core 8
- PostgreSQL 15
- JWT Authentication
- Twilio (SMS/Viber)

### Frontend
- React 18
- TypeScript
- TailwindCSS
- Axios
- Context API for state management

### DevOps
- Docker & Docker Compose
- PostgreSQL
- pgAdmin 4

### Testing
- xUnit
- Moq
- FluentAssertions

---

## License

MIT License

## Author

tselloss

---

**Built with ❤️ for the billiard community**