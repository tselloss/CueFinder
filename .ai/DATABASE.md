# Database Schema Documentation

This document describes the CueFinder PostgreSQL database schema, entity relationships, and data management strategies.

## Database Overview

- **Database**: PostgreSQL 15+
- **ORM**: Entity Framework Core 8.0
- **Migration Strategy**: Code-First
- **Naming Convention**: PascalCase (converted to snake_case by EF)

## Entity Relationship Diagram

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ├───────────┐ │
       │           │ │
       ▼           ▼ ▼
┌──────────┐ ┌─────────────┐ ┌──────────────┐
│   Cue    │ │   Raffle    │ │   Message    │
└────┬─────┘ └──────┬──────┘ └──────────────┘
     │              │
     ▼              ▼
┌──────────┐ ┌──────────────┐
│ CueImage │ │ RaffleEntry  │
└──────────┘ └──────────────┘
```

## Core Entities

### User

**Purpose**: Core user account for authentication and profile management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| Username | string(50) | Unique, Not Null | Login username |
| Email | string(100) | Unique, Not Null | Email address |
| PasswordHash | string(500) | Not Null | BCrypt hashed password |
| Name | string(100) | Not Null | Display name |
| Phone | string(20) | Nullable | Contact phone |
| HidePhone | bool | Default: false | Privacy setting |
| Role | string(50) | Default: 'user' | Access role |
| ProfilePictureUrl | string | Nullable | Profile image URL |
| Bio | text | Nullable | User biography |
| Location | string(200) | Nullable | General location |
| Address | string | Nullable | Full address |
| City | string | Nullable | City |
| State | string | Nullable | State/Province |
| ZipCode | string | Nullable | Postal code |
| Country | string | Nullable | Country |
| IsEmailVerified | bool | Default: false | Email verification status |
| IsPhoneVerified | bool | Default: false | Phone verification status |
| IsActive | bool | Default: true | Account status |
| CreatedAt | datetime | Default: UTC NOW | Registration date |
| UpdatedAt | datetime | Auto-update | Last modification |

**Indexes**:
- `IX_User_Username` (Unique)
- `IX_User_Email` (Unique)

**Relationships**:
- → One-to-Many: Cues, CueCases, BilliardTables, Accessories, CueSets
- → One-to-Many: Raffles (as Organizer)
- → One-to-Many: RaffleEntries (as Participant)
- → One-to-Many: Messages (sent)
- → One-to-Many: Ratings (given)
- → Many-to-Many: SavedCues, SavedBilliardTables

### Cue

**Purpose**: Billiard cue marketplace listing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| Title | string(200) | Not Null | Cue name/title |
| Brand | string(100) | Not Null | Manufacturer |
| Description | text | Nullable | Detailed description |
| Price | decimal(10,2) | Not Null | Price in EUR/USD |
| CueType | string(50) | Nullable | playing/break/jump |
| Weight | decimal | Nullable | Weight in ounces |
| Length | decimal | Nullable | Length in inches |
| TipSize | decimal | Nullable | Tip diameter (mm) |
| ShaftMaterial | string | Nullable | e.g., maple, carbon |
| WrapMaterial | string | Nullable | e.g., leather, linen |
| ManufactureYear | int | Nullable | Year made |
| Condition | string(50) | Default: 'good' | mint/excellent/good/fair/poor |
| Location | string(200) | Not Null | Geographic location |
| IsSold | bool | Default: false | Sale status |
| SoldDate | datetime | Nullable | Date sold |
| UserId | int | FK, Not Null | Owner reference |
| ViewCount | int | Default: 0 | Analytics |
| CreatedAt | datetime | Default: UTC NOW | Posted date |
| UpdatedAt | datetime | Auto-update | Last modified |

**Indexes**:
- `IX_Cue_UserId`
- `IX_Cue_IsSold`
- `IX_Cue_Brand_Type` (Composite)

**Relationships**:
- ← Many-to-One: User (seller)
- → One-to-Many: CueImages
- → One-to-Many: Ratings
- → Many-to-Many: SavedCues (favorited by users)

### Raffle

**Purpose**: Raffle/lottery system for billiard items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| OrganizerId | int | FK, Not Null | Raffle creator |
| Title | string | Not Null | Raffle title |
| Description | text | Nullable | Item description |
| ItemImageUrl | string | Nullable | Item photo |
| TotalSpots | int | Not Null | Available spots |
| PricePerSpot | decimal(10,2) | Not Null | Entry price |
| EndsAt | datetime | Not Null | Expiration date |
| AutoEndWhenFull | bool | Default: false | Auto-close feature |
| AcceptPayPal | bool | Default: false | Payment method flag |
| AcceptRevolut | bool | Default: false | Payment method flag |
| AcceptBankTransfer | bool | Default: false | Payment method flag |
| AcceptViva | bool | Default: false | Payment method flag (Greek) |
| AcceptIris | bool | Default: false | Payment method flag (Greek) |
| AcceptDM | bool | Default: true | Arrange via message |
| PaymentDetails | text | Nullable | Payment instructions |
| Status | string | Default: 'open' | open/closed/drawn/cancelled |
| WinnerId | int | FK, Nullable | Winner reference |
| WinnerSpotNumber | int | Nullable | Winning spot |
| WinnerCardImageUrl | string | Nullable | Winner proof image |
| CreatedAt | datetime | Default: UTC NOW | Creation date |
| DrawnAt | datetime | Nullable | Winner drawn date |

**Relationships**:
- ← Many-to-One: User (organizer)
- ← Many-to-One: User (winner)
- → One-to-Many: RaffleEntries

### RaffleEntry

**Purpose**: Individual spot claim in a raffle

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| RaffleId | int | FK, Not Null | Parent raffle |
| UserId | int | FK, Not Null | Participant |
| SpotNumber | int | Not Null | Claimed spot (1-N) |
| ClaimedAt | datetime | Default: UTC NOW | Claim timestamp |
| PaymentStatus | string | Default: 'pending' | pending/paid/verified |
| VerifiedAt | datetime | Nullable | Payment verified date |
| PaymentProof | string | Nullable | Evidence (optional) |

**Constraints**:
- Unique constraint on (RaffleId, SpotNumber)

**Relationships**:
- ← Many-to-One: Raffle
- ← Many-to-One: User

### CueImage

**Purpose**: Image attachments for cue listings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| CueId | int | FK, Not Null | Parent cue |
| ImageUrl | string | Not Null | File path |
| ImageData | text | Nullable | Base64 encoded (prod) |
| ContentType | string(100) | Nullable | MIME type |
| AltText | string(200) | Nullable | Accessibility text |
| Sort | int | Default: 0 | Display order |
| UploadedAt | datetime | Default: UTC NOW | Upload timestamp |

**Indexes**:
- `IX_CueImage_CueId`

**Relationships**:
- ← Many-to-One: Cue

### Message

**Purpose**: Direct messaging between users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| SenderId | int | FK, Not Null | Message sender |
| ReceiverId | int | FK, Not Null | Message recipient |
| Subject | string | Nullable | Message subject |
| Body | text | Not Null | Message content |
| IsRead | bool | Default: false | Read status |
| SentAt | datetime | Default: UTC NOW | Send timestamp |
| ReadAt | datetime | Nullable | Read timestamp |
| IsDeleted | bool | Default: false | Soft delete flag |

**Indexes**:
- `IX_Message_SenderId`
- `IX_Message_ReceiverId`
- `IX_Message_IsRead`

**Relationships**:
- ← Many-to-One: User (sender)
- ← Many-to-One: User (receiver)

### Rating

**Purpose**: User ratings and reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | int | PK, Identity | Unique identifier |
| RaterId | int | FK, Not Null | User giving rating |
| RatedUserId | int | FK, Not Null | User being rated |
| CueId | int | FK, Nullable | Related cue (optional) |
| Score | int | 1-5 | Star rating |
| Comment | text | Nullable | Review text |
| CreatedAt | datetime | Default: UTC NOW | Rating date |

**Relationships**:
- ← Many-to-One: User (rater)
- ← Many-to-One: User (rated)
- ← Many-to-One: Cue (optional)

## Supporting Entities

### CueCase, BilliardTable, Accessory, CueSet

These entities follow the same structure as `Cue`:
- Same base fields (Title, Brand, Description, Price, etc.)
- Own image tables (CueCaseImage, BilliardTableImage, etc.)
- Same relationship with User

### PhoneVerificationToken

**Purpose**: Phone number verification via SMS

| Column | Type | Description |
|--------|------|-------------|
| Id | int | PK |
| UserId | int | FK → User |
| Token | string | 6-digit code |
| ExpiresAt | datetime | Expiration |
| CreatedAt | datetime | Creation date |

### PasswordResetToken

**Purpose**: Password reset flow

| Column | Type | Description |
|--------|------|-------------|
| Id | int | PK |
| UserId | int | FK → User |
| Token | string | Secure token |
| ExpiresAt | datetime | Expiration (15 min) |
| CreatedAt | datetime | Creation date |

### FlaggedImage

**Purpose**: Content moderation queue for images

| Column | Type | Description |
|--------|------|-------------|
| Id | int | PK |
| ImageType | string | cue/raffle/profile |
| EntityId | int | Image owner ID |
| ImageUrl | string | Image path |
| ReportedBy | int | FK → User |
| Reason | text | Report reason |
| Status | string | pending/approved/removed |
| CreatedAt | datetime | Report date |

## Migrations

### Running Migrations

```powershell
# Create migration
dotnet ef migrations add MigrationName --project SolutionLibraries/CueFinder.Database

# Apply to database
dotnet ef database update --project SolutionLibraries/CueFinder.Database

# Revert migration
dotnet ef database update PreviousMigration --project SolutionLibraries/CueFinder.Database

# Generate SQL script
dotnet ef migrations script --project SolutionLibraries/CueFinder.Database --output migration.sql
```

### Production Migration Process

1. Test migration locally
2. Generate SQL script
3. Review script for safety
4. Backup production database
5. Apply during maintenance window
6. Verify schema changes
7. Run data integrity checks

## Query Patterns

### Common Queries

**Get all active cues with images:**
```csharp
var cues = await _context.Cues
    .Where(c => !c.IsSold && c.User.IsActive)
    .Include(c => c.Images)
    .Include(c => c.User)
    .OrderByDescending(c => c.CreatedAt)
    .ToListAsync();
```

**Get raffle with entries:**
```csharp
var raffle = await _context.Raffles
    .Include(r => r.Organizer)
    .Include(r => r.Entries)
        .ThenInclude(e => e.User)
    .FirstOrDefaultAsync(r => r.Id == raffleId);
```

**Count unread messages:**
```csharp
var unreadCount = await _context.Messages
    .Where(m => m.ReceiverId == userId && !m.IsRead && !m.IsDeleted)
    .CountAsync();
```

## Performance Optimization

### Indexing Strategy
- All foreign keys have indexes
- Frequently queried fields (IsSold, Status) indexed
- Composite indexes for common filter combinations

### Query Optimization
- Use `.AsNoTracking()` for read-only queries
- Project to DTOs instead of loading full entities
- Avoid N+1 queries with `.Include()`
- Use pagination for large result sets

### Connection Pooling
Enabled by default in `DbContext` configuration:
```csharp
builder.Services.AddDbContext<CueFinderDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
        npgsqlOptions.CommandTimeout(30)
                    .EnableRetryOnFailure(3)
    )
);
```

## Data Integrity

### Foreign Key Constraints
All relationships enforced at database level.

### Delete Behaviors
- Cascade: Images when parent entity deleted
- Restrict: Users cannot be deleted if they have active listings
- SetNull: Ratings remain when cue deleted

### Unique Constraints
- User.Email
- User.Username
- (RaffleId, SpotNumber) for RaffleEntry

## Backup Strategy

### Development
```powershell
# Backup
pg_dump -U postgres cuefinder > backup.sql

# Restore
psql -U postgres -d cuefinder < backup.sql
```

### Production
- Automatic daily backups (DigitalOcean Managed Database)
- Point-in-time recovery (PITR)
- Off-site replication
- Manual backup before migrations

## Data Seeding

Seed data scripts in `init.sql/`:
- `seed-forum-categories.sql` - Forum categories
- `seed-test-users.sql` - Test accounts
- `seed-sample-listings.sql` - Sample data

---

Last Updated: April 2, 2026
