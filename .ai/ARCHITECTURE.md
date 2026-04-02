# System Architecture

CueFinder follows a **Clean Architecture** approach with clear separation of concerns between the frontend, backend, and database layers.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Components │  │    Services  │  │    Routing   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS API Calls
┌────────────────────────────┴────────────────────────────────────┐
│                      Backend (ASP.NET Core)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Controllers │→→│   Services   │→→│  Repositories│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │ EF Core
┌──────────────────────────────────────────────┴───────────────────┐
│                      Database (PostgreSQL)                       │
│  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌────────────┐         │
│  │  Users   │  │  Cues  │  │ Raffles │  │   Forum    │         │
│  └──────────┘  └────────┘  └─────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Layered Structure

The backend follows a **modular monolith** architecture with domain-separated libraries:

```
CueFinderBE (Main API)
    ↓
SolutionLibraries/ (Domain Libraries)
    ├── CueFinder.Core           # Shared utilities, interfaces
    ├── CueFinder.Database        # DbContext, models, migrations
    ├── CueFinder.Extensions      # Common extensions
    ├── CueFinder.Auth            # Authentication & authorization
    ├── CueFinder.Cues            # Cues marketplace feature
    ├── CueFinder.CueCases        # Cue cases feature
    ├── CueFinder.BilliardTables  # Billiard tables feature
    ├── CueFinder.Accessories     # Accessories feature
    ├── CueFinder.CueSets         # Cue sets feature
    ├── CueFinder.Raffles         # Raffle system
    ├── CueFinder.Forum           # Community forum
    ├── CueFinder.Messages        # Messaging system
    └── CueFinderModerator        # Moderation service
```

### Layer Responsibilities

#### 1. Controllers Layer
- **Location**: `SolutionLibraries/*/Controllers/`
- **Responsibility**: 
  - HTTP request/response handling
  - Input validation
  - Route mapping
  - Authorization attributes
- **Dependencies**: Services layer
- **Example**: `CuesController.cs`, `RafflesController.cs`

#### 2. Services Layer
- **Location**: `SolutionLibraries/*/Services/`
- **Responsibility**:
  - Business logic implementation
  - Data validation
  - Transaction management
  - Cross-domain orchestration
- **Dependencies**: Database layer, other services
- **Example**: `RaffleService.Write.cs`, `CueService.cs`

#### 3. Database Layer
- **Location**: `SolutionLibraries/CueFinder.Database/`
- **Responsibility**:
  - Entity models
  - DbContext configuration
  - Migrations
  - Data access
- **Dependencies**: Entity Framework Core
- **Example**: `CueFinderDbContext.cs`, `Models/`

#### 4. DTOs (Data Transfer Objects)
- **Location**: `SolutionLibraries/*/Models/`
- **Responsibility**:
  - API request/response contracts
  - Data mapping
  - Validation attributes
- **Example**: `CreateRaffleDto.cs`, `CueListingDto.cs`

### Design Patterns

#### Repository Pattern
- Abstracted in service layer
- DbContext acts as Unit of Work
- Direct EF Core queries in services

#### Service Pattern
- Each domain has dedicated service classes
- Services split by responsibility (e.g., `RaffleService.Write.cs`, `RaffleService.Read.cs`)
- Dependency injection for loose coupling

#### Dependency Injection
All services registered in `Program.cs`:

```csharp
// Database
builder.Services.AddDbContext<CueFinderDbContext>();

// Services
builder.Services.AddScoped<IRaffleService, RaffleService>();
builder.Services.AddScoped<ICueService, CueService>();
builder.Services.AddScoped<IMessageService, MessageService>();

// Authentication
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
```

## Frontend Architecture

### Structure

```
CueFinderFE/
├── packages/
│   └── app/
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── services/         # API service layer
│       │   ├── contexts/         # React contexts (auth, theme)
│       │   ├── hooks/            # Custom React hooks
│       │   ├── locales/          # i18n translation files
│       │   ├── App.js            # Main app component
│       │   └── main.jsx          # Entry point
│       ├── public/               # Static assets
│       └── index.html
```

### Key Architectural Decisions

#### Component Organization
- **Feature-based components**: `RaffleCreateForm`, `CueDetail`
- **Reusable components**: `ImageUpload`, `LoadingSpinner`
- **Layout components**: `Header`, `Footer`, `Navigation`

#### State Management
- **React Context**: Authentication state, user preferences
- **Component State**: Local UI state with `useState`
- **Server State**: API calls with async/await patterns

#### Routing
Using React Router v6:

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/cues" element={<CuesList />} />
  <Route path="/cues/:id" element={<CueDetail />} />
  <Route path="/raffles" element={<RafflesList />} />
  <Route path="/raffles/:id" element={<RaffleDetail />} />
  <Route path="/raffles/:id/edit" element={<RaffleEditForm />} />
  <Route path="/forum" element={<ForumList />} />
</Routes>
```

#### API Service Layer
Centralized API calls in `services/`:

```javascript
// services/raffleService.js
const API_URL = import.meta.env.VITE_API_URL;

export const raffleService = {
  getAllRaffles: () => fetch(`${API_URL}/api/raffles`),
  getRaffleById: (id) => fetch(`${API_URL}/api/raffles/${id}`),
  createRaffle: (data) => fetch(`${API_URL}/api/raffles`, {...}),
  updateRaffle: (id, data) => fetch(`${API_URL}/api/raffles/${id}`, {...})
};
```

## Data Flow

### Create Raffle Example

```
1. User fills RaffleCreateForm
         ↓
2. Form submits → raffleService.createRaffle(data)
         ↓
3. POST /api/raffles → RafflesController.Create()
         ↓
4. Controller validates → RaffleService.CreateRaffleAsync()
         ↓
5. Service validates business rules
         ↓
6. EF Core saves to database
         ↓
7. Return RaffleDto to frontend
         ↓
8. Navigate to raffle detail page
```

### Authentication Flow

```
1. User submits login form
         ↓
2. POST /api/auth/login → AuthController.Login()
         ↓
3. AuthService validates credentials
         ↓
4. JwtTokenService generates JWT token
         ↓
5. Return { token, user } to frontend
         ↓
6. Frontend stores token in localStorage
         ↓
7. Frontend adds Authorization header to all requests
```

## Database Design Philosophy

### Entity Relationships

- **User** → One-to-Many → **Cues, Raffles, Messages**
- **Raffle** → One-to-Many → **RaffleEntries**
- **Cue** → One-to-Many → **CueImages**
- **User** → Many-to-Many → **SavedCues** (via join table)

### Indexing Strategy

- Unique indexes: `User.Email`, `User.Username`
- Performance indexes: `Cue.IsSold`, `Cue.Brand + CueType`
- Foreign key indexes: All FK columns

### Soft Deletes

Most entities use soft deletes:
- `IsActive` or `IsDeleted` flags
- Preserves data for auditing
- Allows restoration

## Security Architecture

### Authentication
- **JWT Bearer Tokens**: Stateless authentication
- **Password Hashing**: BCrypt with salt + pepper
- **OAuth Integration**: Google sign-in support

### Authorization
- **Role-based**: User, Admin, Moderator
- **Resource ownership**: Users can only edit their own content
- **Controller attributes**: `[Authorize(Roles = "Admin")]`

### Data Protection
- **SQL Injection**: Protected via EF Core parameterization
- **XSS**: React escapes by default
- **CORS**: Configured origin whitelist
- **HTTPS**: Enforced in production

## Scalability Considerations

### Current Architecture
- Monolith with modular design
- Single database instance
- Suitable for startup to medium scale

### Future Scaling Options

1. **Database Scaling**
   - Read replicas for queries
   - Connection pooling (already enabled)
   - Database sharding by feature

2. **Service Splitting**
   - Extract `CueFinder.Forum` as microservice
   - Extract `CueFinder.Messages` as real-time service
   - API Gateway pattern

3. **Caching Layer**
   - Redis for session management
   - Redis for frequently accessed data
   - CDN for static assets

4. **Async Processing**
   - Message queue for notifications
   - Background jobs for image processing
   - Event-driven architecture

## Testing Strategy

See [TESTING.md](TESTING.md) for detailed testing architecture.

### Unit Tests
- Test individual service methods
- Mock dependencies (DbContext, ILogger)
- In-memory database for isolation

### Integration Tests
- Test full request/response cycles
- Real PostgreSQL database
- Cleanup after each test

## Deployment Architecture

### Development
```
Docker Compose
├── cuefinder-postgres (PostgreSQL)
├── cuefinder-backend (ASP.NET Core)
└── cuefinder-frontend (Nginx + React)
```

### Production
```
DigitalOcean
├── App Platform (Backend container)
├── App Platform (Frontend container)
└── Managed PostgreSQL (Database)
```

## Technology Choices Rationale

| Technology | Reason |
|------------|--------|
| ASP.NET Core 8.0 | Modern, performant, cross-platform |
| PostgreSQL | Open-source, robust, excellent JSON support |
| React 18 | Component-based, large ecosystem, Virtual DOM |
| Entity Framework Core | Mature ORM, code-first migrations |
| JWT | Stateless, scalable authentication |
| Docker | Consistent environments, easy deployment |
| xUnit | Industry standard for .NET testing |

---

Last Updated: April 2, 2026
