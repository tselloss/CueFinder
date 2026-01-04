# CueFinder Backend Architecture

## Overview
CueFinder backend is built using a **feature-based class library architecture** with clean separation of concerns. The solution is organized around business domains rather than technical layers.

## Solution Structure

### Main Project
- **CueFinderBE** - ASP.NET Core Web API
  - Entry point for the application
  - Dependency injection configuration
  - HTTP endpoints (Controllers)
  - Middleware and routing setup

### Class Libraries

#### 1. **CueFinder.Common**
**Purpose**: Shared interfaces and utilities across all libraries
- Location: `CueFinder.Common/`
- **Files**:
  - `Interfaces/IAuthService.cs` - Authentication service contract
- **Dependencies**: None (foundation library)

#### 2. **CueFinder.Auth**
**Purpose**: Authentication and authorization logic
- Location: `CueFinder.Auth/`
- **Files**:
  - `Interfaces/IAuthService.cs` - Authentication service interface
  - `Services/AuthService.cs` - JWT token generation/validation, password hashing/verification
- **Key Responsibilities**:
  - JWT token generation with custom claims
  - JWT token validation
  - Password hashing using BCrypt
  - Password verification
  - User principal extraction from tokens
- **Dependencies**: 
  - System.IdentityModel.Tokens.Jwt 7.0.0
  - Microsoft.IdentityModel.Tokens 7.0.0
  - BCrypt.Net-Next 4.0.3
  - CueFinder.Common

#### 3. **CueFinder.User**
**Purpose**: User domain models, profiles, and related DTOs
- Location: `CueFinder.User/`
- **Files**:
  - `Models/User.cs` - Core user entity with relationships to Cues, Ratings
  - `Models/UserProfile.cs` - Extended user profile with seller metrics
  - `DTOs/UserDtos.cs`:
    - `UserRegisterDto` - Registration request
    - `UserLoginDto` - Login request
    - `UserDto` - User response (excludes sensitive data)
    - `UserProfileUpdateDto` - Profile update request
    - `UserProfileDto` - Profile response
    - `AddressDto` - Address information
- **Key Relationships**:
  - User → Cues (One-to-Many: seller relationship)
  - User → Ratings (One-to-Many: seller ratings and buyer ratings)
- **Dependencies**:
  - Microsoft.EntityFrameworkCore 8.0.0
  - CueFinder.Common

#### 4. **CueFinder.Cues**
**Purpose**: Billiard cue listings, inventory, and related DTOs
- Location: `CueFinder.Cues/`
- **Files**:
  - `Models/Cue.cs` - Cue listing with seller reference and specifications
  - `Models/CueImage.cs` - Image management for cues
  - `DTOs/CueDtos.cs`:
    - `CreateCueDto` - Create listing request
    - `UpdateCueDto` - Update listing request
    - `CueDto` - Full cue response
    - `CueListItemDto` - Summary view for listings
    - `CueImageDto` - Image information
- **Key Fields**:
  - Title, Description, Brand, Model
  - Price, Condition, Weight, Length, TipSize
  - IsSold, IsActive status
  - SellerId (foreign key to User)
- **Key Relationships**:
  - Cue → Seller (User, foreign key)
  - Cue → CueImages (One-to-Many)
  - Cue → Ratings (One-to-Many)
- **Dependencies**:
  - Microsoft.EntityFrameworkCore 8.0.0
  - CueFinder.User
  - CueFinder.Rating
  - CueFinder.Common

#### 5. **CueFinder.Rating**
**Purpose**: Review and rating system for cues and sellers
- Location: `CueFinder.Rating/`
- **Files**:
  - `Models/Rating.cs` - Rating/review entity
  - `DTOs/RatingDtos.cs`:
    - `CreateRatingDto` - Create review request
    - `RatingDto` - Rating response
    - `SellerResponseDto` - Seller reply to review
- **Key Fields**:
  - Score (1-5 stars)
  - ReviewText, SellerResponse
  - IsVerified, HelpfulCount
  - Timestamps (CreatedAt, ResponseDate)
- **Key Relationships**:
  - Rating → Cue (foreign key)
  - Rating → Seller (User, foreign key)
  - Rating → Buyer (User, foreign key)
- **Dependencies**:
  - Microsoft.EntityFrameworkCore 8.0.0
  - CueFinder.User
  - CueFinder.Cues
  - CueFinder.Common

#### 6. **CueFinder.Data**
**Purpose**: Database context and data access layer
- Location: `CueFinder.Data/`
- **Files**:
  - `CueFinderDbContext.cs` - EF Core DbContext with entity configurations
- **DbSets**:
  - Users
  - Cues
  - CueImages
  - UserProfiles
  - Ratings
- **Key Configurations**:
  - Unique constraints on Username and Email
  - Foreign key relationships with appropriate delete behaviors
  - Decimal precision for Price, Weight, Length, TipSize
  - Indexes on frequently queried fields (SellerId, Brand, IsSold, IsActive, CreatedAt)
- **Dependencies**:
  - Microsoft.EntityFrameworkCore 8.0.0
  - Microsoft.EntityFrameworkCore.SqlServer 8.0.0
  - Microsoft.EntityFrameworkCore.Tools 8.0.0
  - CueFinder.User
  - CueFinder.Cues
  - CueFinder.Rating

## Dependency Injection

All services are registered in `Program.cs`:

```csharp
// DbContext registration
builder.Services.AddDbContext<CueFinderDbContext>(options =>
    options.UseSqlServer(connectionString));

// Auth service registration
builder.Services.AddScoped<IAuthService>(provider =>
    new AuthService(secret, issuer, audience, expirationMinutes));

// JWT authentication middleware
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { ... });
```

## Technology Stack

- **.NET 8.0** - Target framework
- **Entity Framework Core 8.0** - ORM for database operations
- **SQL Server** - Database provider
- **JWT (System.IdentityModel.Tokens.Jwt 7.0.0)** - Token-based authentication
- **BCrypt.Net-Next 4.0.3** - Secure password hashing
- **ASP.NET Core 8.0** - Web framework

## Key Architectural Principles

1. **Feature-Based Organization**: Libraries are organized by business domain (User, Cues, Rating, Auth) rather than technical layers
2. **Clear Separation of Concerns**: Each library has a single responsibility
3. **Dependency Management**: Feature libraries depend on lower-level libraries; no circular dependencies
4. **Interface-Based Services**: Services implement interfaces for testability and loose coupling
5. **DTOs for API Contracts**: All API requests/responses use DTOs, separating API contracts from database models
6. **Centralized Configuration**: Database context and dependency injection configured in main project

## Project References Hierarchy

```
CueFinderBE (Main API)
    ├── CueFinder.Common
    ├── CueFinder.Auth
    │   └── CueFinder.Common
    ├── CueFinder.User
    │   └── CueFinder.Common
    ├── CueFinder.Cues
    │   ├── CueFinder.User
    │   ├── CueFinder.Rating
    │   └── CueFinder.Common
    ├── CueFinder.Rating
    │   ├── CueFinder.User
    │   ├── CueFinder.Cues
    │   └── CueFinder.Common
    └── CueFinder.Data
        ├── CueFinder.User
        ├── CueFinder.Cues
        └── CueFinder.Rating
```

## Database Schema

### Users Table
- Id (PK)
- Username (Unique, Required)
- PasswordHash (Required)
- Name, Email (Unique, Required)
- Phone, Location, Bio
- ProfileImageUrl
- Role, IsActive, IsBanned
- CreatedAt, UpdatedAt

### Cues Table
- Id (PK)
- Title, Description, Brand, Model
- Price, Condition
- Weight, Length, TipSize
- IsSold, IsActive
- SellerId (FK → Users)
- CreatedAt, UpdatedAt
- Indexes: SellerId, Brand, IsSold, IsActive, CreatedAt

### CueImages Table
- Id (PK)
- CueId (FK → Cues, Cascade Delete)
- ImageUrl (Required)
- AltText
- DisplayOrder, IsPrimary
- UploadedAt

### UserProfiles Table
- Id (PK)
- UserId (FK → Users, Unique, Cascade Delete)
- ProfileImageUrl, Bio, Phone, Location
- Street, City, State, PostalCode, Country
- SellerRating, SalesCount, PositiveRatings
- IsVerified, IsPublic
- MemberSince, UpdatedAt

### Ratings Table
- Id (PK)
- CueId (FK → Cues, Cascade Delete)
- SellerId (FK → Users, Restrict Delete)
- BuyerId (FK → Users, Restrict Delete)
- Score (1-5, Default=5)
- ReviewText, SellerResponse
- HelpfulCount, IsVerified
- CreatedAt, ResponseDate
- Indexes: SellerId, BuyerId, CueId

## Controllers

All controllers are in the main `CueFinderBE/Controllers/` directory:

1. **AuthController** - `/api/auth`
   - POST /register - User registration
   - POST /login - User login
   - GET /profile - Get user profile (requires auth)
   - POST /profile - Update profile
   - POST /validate - Validate token
   - POST /logout - Logout user

2. **CuesController** - `/api/cues`
   - GET / - List all cues with filtering
   - GET /{id} - Get cue details
   - GET /search - Search cues
   - POST / - Create new listing (requires auth)
   - PUT /{id} - Update listing (requires auth)
   - DELETE /{id} - Delete listing (requires auth)

3. **RatingsController** - `/api/ratings`
   - GET /cue/{cueId} - Get cue ratings
   - GET /seller/{sellerId} - Get seller ratings
   - POST / - Create rating (requires auth)
   - POST /{id}/response - Seller response to review (requires auth)
   - POST /{id}/helpful - Mark review as helpful

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=CueFinderDB;..."
  },
  "Jwt": {
    "Secret": "your-super-secret-key-...",
    "Issuer": "cuefinder",
    "Audience": "cuefinder",
    "ExpirationMinutes": 120
  },
  "CorsOrigins": {
    "Frontend": "http://localhost:3000"
  }
}
```

## Building & Running

```bash
# Build solution
dotnet build

# Run migrations
dotnet ef database update --project CueFinder.Data

# Run API
dotnet run --project CueFinderBE
```

## Future Enhancements

- Repository pattern for data access
- Unit of Work pattern for transaction management
- Feature-specific services (UserService, CueService, etc.)
- API versioning for backward compatibility
- Integration tests with in-memory database
- Entity validation with FluentValidation
