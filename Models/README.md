# CueFinder Models and Database Context

This folder contains all the data models and Entity Framework Core DbContext for the CueFinder application.

## Project Structure

### Core Entities

#### **User.cs**
Represents a user account in the system.
- User identification and authentication
- Profile information (name, email, phone, address)
- Account status and verification
- Navigation properties to related entities

#### **Cue.cs**
Represents a billiard cue listing.
- Cue specifications (type, material, weight, length, etc.)
- Listing information (price, condition, location)
- Sales status tracking
- Ratings and view count
- Navigation properties to images, ratings, and saved by users

#### **CueImage.cs**
Represents an image associated with a cue listing.
- Image URL and metadata
- Display order and primary image flag
- Alt text for accessibility

#### **Rating.cs**
Represents user ratings and reviews for cues and sellers.
- Links rater, seller, and cue
- Rating value (1-5 stars)
- Review text and category
- Timestamps for creation and updates

#### **Message.cs**
Represents messages/conversations between users.
- Sender and recipient references
- Optional cue reference (for inquiries)
- Message type (inquiry, offer, negotiation, etc.)
- Read status tracking

#### **SavedCue.cs**
Represents user's saved/favorited cues.
- User-Cue relationship tracking
- Optional notes about the saved cue
- Timestamp of when saved

#### **Transaction.cs**
Represents completed or pending sales transactions.
- Seller, buyer, and cue information
- Sale price and shipping details
- Payment method tracking
- Transaction status and timestamps

### Support Models

#### **CueSearchFilter.cs**
Search and filter parameters for querying cue listings.
- Price range, brand, type, condition filters
- Weight and length ranges
- Sorting and pagination options
- Used in API search endpoints

#### **PaginatedResponse<T>.cs**
Generic wrapper for paginated API responses.
- Items collection
- Pagination metadata (total count, page info, has next/previous)
- Reusable for any list endpoint

### Database Context

#### **CueFinderDbContext.cs**
Entity Framework Core DbContext configuration.
- DbSet definitions for all entities
- Relationship configuration
- Index definitions for performance
- Constraints and validation rules

## Database Schema Highlights

### Key Relationships

```
User (1) ──→ (Many) Cue
User (1) ──→ (Many) Rating (as RatedByUser)
User (1) ──→ (Many) Rating (as SellerUser)
User (1) ──→ (Many) Message (as Sender)
User (1) ──→ (Many) Message (as Recipient)
User (1) ──→ (Many) SavedCue

Cue (1) ──→ (Many) CueImage
Cue (1) ──→ (Many) Rating
Cue (1) ──→ (Many) SavedCue
```

### Indexes for Performance

- `IX_User_Username` - Unique index on username
- `IX_User_Email` - Unique index on email
- `IX_Cue_UserId` - Foreign key index
- `IX_Cue_IsSold` - For filtering active listings
- `IX_Cue_Brand_Type` - For common search filters
- `IX_CueImage_CueId` - For image retrieval
- `IX_Message_Sender_Recipient` - For message queries
- `IX_Message_IsRead` - For unread message counts
- `IX_SavedCue_Unique_User_Cue` - Unique constraint
- `IX_Rating_Unique_User_Cue` - Unique constraint
- `IX_Transaction_Number` - Unique order number
- `IX_Transaction_Status` - For transaction reporting

## Data Constraints

### Unique Constraints

- Username (case-insensitive)
- Email (case-insensitive)
- Rating per user per cue (one rating per user)
- Saved cue per user (one save per user)
- Transaction number

### Delete Behaviors

- **Cascade**: When a user deletes a cue, all related images, ratings, and saved records are deleted
- **Restrict**: Critical relationships (user→cue, rating→cue) prevent orphaned data
- **SetNull**: Optional relationships (message→cue) can be null when cue is deleted

## Usage in API

### With Dependency Injection

```csharp
public class CueService
{
    private readonly CueFinderDbContext _context;

    public CueService(CueFinderDbContext context)
    {
        _context = context;
    }

    public async Task<Cue?> GetCueAsync(int id)
    {
        return await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}
```

### Search and Filter

```csharp
var filter = new CueSearchFilter
{
    Query = "predator",
    MinPrice = 100,
    MaxPrice = 500,
    Brand = "Predator",
    PageNumber = 1,
    PageSize = 20
};

// Use in repository/service to build dynamic queries
```

### Pagination

```csharp
var response = new PaginatedResponse<Cue>
{
    Items = cues,
    TotalCount = totalCount,
    PageNumber = filter.PageNumber,
    PageSize = filter.PageSize
};
```

## Migration Guide

### Initial Database Setup

```bash
# Create initial migration
dotnet ef migrations add InitialCreate --project CueFinderBE

# Apply migrations
dotnet ef database update --project CueFinderBE
```

### Adding New Models

1. Create the model class in this folder
2. Add DbSet to CueFinderDbContext
3. Configure relationships in OnModelCreating()
4. Create and apply migration
5. Update related services and repositories

## Data Validation

### Server-Side Validation

- All required fields are configured with `.IsRequired()`
- String lengths are defined with `.HasMaxLength()`
- Decimal precision for monetary values: `HasPrecision(10, 2)`
- Unique constraints prevent duplicate entries

### Application-Level Validation

Consider adding data annotations for:
- Email format validation
- Phone number format
- Price range validation
- Custom business rule validation

## Performance Considerations

1. **Eager Loading**: Use `.Include()` for related data to avoid N+1 queries
2. **Pagination**: Always paginate results for large datasets
3. **Indexing**: All FK and common filter columns are indexed
4. **Query Optimization**: Use projections with `.Select()` when full entities aren't needed

## Future Extensions

- Add soft delete functionality (IsDeleted flag)
- Add audit logging (CreatedBy, ModifiedBy)
- Add notification preferences to User
- Add listing categories/tags
- Add user wishlist/watch features
- Add reported content/moderation
- Add inventory tracking for multiple units
