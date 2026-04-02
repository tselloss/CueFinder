# Features Documentation

Comprehensive guide to all CueFinder features and their implementations.

## Overview

CueFinder is a billiards marketplace and community platform with the following core features:

1. **Marketplace** - Buy/sell cues, cases, tables, accessories, and cue sets
2. **Raffle System** - Lottery-style listings for high-value items
3. **Community Forum** - Discussions and knowledge sharing
4. **Direct Messaging** - Communication between users
5. **User Profiles** - Ratings, reviews, and verification

---

## 1. Marketplace Features

### Cues

**Purpose**: List and browse billiard cues for sale

**Key Features**:
- Create detailed cue listings with specs (weight, length, tip size, materials)
- Upload multiple images
- Filter by brand, type, condition, price range
- Mark as sold when transaction complete
- Save favorite listings

**Technical Implementation**:
- **Backend**: `CueFinder.Cues` library
- **Controller**: `CuesController` (split into QueryOperations and CrudOperations)
- **Service**: `CueService` with filtering and search logic
- **Database**: `Cue` and `CueImage` entities

**Business Rules**:
- Only owner can edit/delete listing
- Cannot delete if there are active inquiries (soft delete)
- Images limited to 10 per listing
- Price must be positive

**API Endpoints**:
- `GET /api/cues` - Browse all cues
- `GET /api/cues/{id}` - View cue details
- `POST /api/cues` - Create listing (auth required)
- `PUT /api/cues/{id}` - Update listing (owner only)
- `DELETE /api/cues/{id}` - Delete listing (owner only)
- `POST /api/cues/{id}/sold` - Mark as sold (owner only)

### Cue Cases

**Purpose**: List and browse cue cases

**Features**: Similar to Cues with case-specific fields
- Number of cue slots
- Case type (soft/hard)
- Brand, color, dimensions

**Technical Implementation**:
- **Backend**: `CueFinder.CueCases` library
- **Database**: `CueCase` and `CueCaseImage` entities

### Billiard Tables

**Purpose**: List and browse billiard tables

**Table-Specific Fields**:
- Table size (7ft, 8ft, 9ft)
- Slate type (1-piece, 3-piece)
- Cloth brand and color
- Accessories included

**Technical Implementation**:
- **Backend**: `CueFinder.BilliardTables` library
- **Database**: `BilliardTable` and `BilliardTableImage` entities

### Accessories

**Purpose**: List miscellaneous billiard accessories

**Examples**: Chalk, gloves, cue tips, jump handles, shafts

**Technical Implementation**:
- **Backend**: `CueFinder.Accessories` library
- **Database**: `Accessory` and `AccessoryImage` entities

### Cue Sets

**Purpose**: List complete cue sets (multiple cues sold together)

**Features**:
- List multiple cues as a package
- Discounted pricing for sets
- Individual cue details within set

**Technical Implementation**:
- **Backend**: `CueFinder.CueSets` library
- **Database**: `CueSet` and `CueSetImage` entities

---

## 2. Raffle System

**Purpose**: Lottery-style listings where users claim numbered spots and seller draws a winner

### How It Works

1. **Organizer creates raffle**:
   - Sets total spots (e.g., 100)
   - Sets price per spot (e.g., €10)
   - Adds item description and photo
   - Specifies payment methods
   - Sets end date

2. **Users enter raffle**:
   - Browse open raffles
   - Claim specific spot number
   - Pay organizer off-platform
   - Submit payment proof (optional)

3. **Organizer verifies payments**:
   - Reviews payment confirmations
   - Marks entries as verified

4. **Winner selection**:
   - Organizer draws random winner
   - Winner card image uploaded
   - Winner notified via messages

### Key Features

#### Auto-Close When Full ✨ NEW
- Optional setting when creating raffle
- Automatically closes raffle when all spots claimed AND paid
- Organizer receives notification

#### Edit/Delete Restrictions ✨ NEW
- Cannot edit raffle if active (paid/verified) bookings exist
- Cannot delete raffle if active bookings exist
- Prevents organizer from changing rules mid-raffle

#### Payment Methods (European-Friendly)
- PayPal
- Revolut
- Bank Transfer (IBAN)
- Viva Wallet (Greece)
- IRIS Pay (Greece)
- Direct Message (arrange privately)

#### Raffle States
- `open` - Accepting entries
- `closed` - No longer accepting entries
- `drawn` - Winner selected
- `cancelled` - Raffle cancelled (refunds issued)

### Business Rules

1. **Spot Number Uniqueness**: Each spot can only be claimed once per raffle
2. **Payment Verification**: Only organizer can verify payments
3. **Edit Restrictions**: Cannot modify raffle with active (paid/verified) entries
4. **Delete Restrictions**: Cannot delete raffle with any paid entries
5. **Winner Selection**: Only possible when raffle is closed and has >0 entries
6. **Auto-Close Logic**: 
   - Triggers when last spot is claimed (if enabled)
   - Triggers when all spots are verified as paid (if enabled)
   - Sends notification to organizer

### Technical Implementation

**Backend**: `CueFinder.Raffles` library

**Key Components**:
- `RaffleService.Write.cs` - Create, Update, Delete, Enter, Verify
- `RaffleService.Read.cs` - Queries and filtering
- `RaffleService.Winner.cs` - Winner selection logic

**Database Entities**:
- `Raffle` - Main raffle entity
- `RaffleEntry` - Individual spot claims

**Testing**:
- 17 unit tests in `CueFinder.Raffles.Tests`
- Integration tests for full workflows
- Coverage: Create, update, delete validation, auto-close scenarios

**API Endpoints**:
- `GET /api/raffles` - Browse raffles (filter by status)
- `GET /api/raffles/{id}` - View raffle details
- `GET /api/raffles/my-raffles` - My created raffles
- `GET /api/raffles/my-entries` - Raffles I've entered
- `POST /api/raffles` - Create raffle
- `PUT /api/raffles/{id}` - Update raffle (validation applied)
- `DELETE /api/raffles/{id}` - Delete raffle (validation applied)
- `POST /api/raffles/{id}/enter` - Claim spot
- `POST /api/raffles/{id}/entries/{entryId}/verify` - Verify payment
- `POST /api/raffles/{id}/draw` - Draw winner

---

## 3. Community Forum

**Purpose**: Discussion platform for billiards community

### Features

- **Categories**: Equipment, Technique, Events, General Discussion
- **Topics**: Create discussion threads
- **Posts**: Reply to topics
- **Moderation**: Admins can moderate content

### Technical Implementation

**Backend**: `CueFinder.Forum` library

**Database Entities**:
- `ForumCategory`
- `ForumTopic`
- `ForumPost`

**Special Features**:
- Separate `ForumDbContext` for forum isolation
- Rich text support for posts
- User mentions
- Post editing with edit history

---

## 4. Direct Messaging

**Purpose**: Private communication between users

### Features

- Send messages to any user
- Conversation threads
- Unread message indicators
- Message search
- Archive/delete messages

### Technical Implementation

**Backend**: `CueFinder.Messages` library

**Database Entity**: `Message`

**Key Methods**:
- `SendMessageAsync()` - Send new message
- `GetConversationsAsync()` - List all conversations
- `GetMessagesWithUserAsync()` - Get thread with specific user
- `MarkAsReadAsync()` - Mark message read

**Notifications**:
- Used by raffle system for auto-close alerts
- Used for winner announcements
- Used for payment verification requests

---

## 5. User Management

### Authentication

**Methods**:
- Email/Password (BCrypt hashing with server pepper)
- Google OAuth 2.0

**Security**:
- JWT tokens (60-minute expiration)
- Refresh tokens (planned)
- Password complexity requirements

**Technical Implementation**:
- **Backend**: `CueFinder.Auth` library
- **Service**: `AuthService`, `JwtTokenService`

### User Profiles

**Features**:
- Display name, bio, location
- Profile picture
- Contact information (phone, email)
- Privacy settings (hide phone)
- Account verification status

### Ratings & Reviews

**Features**:
- 5-star rating system
- Written reviews
- Average rating calculation
- Rating count display

**Business Rules**:
- Can only rate after transaction
- One rating per transaction
- Cannot rate yourself
- Cannot edit rating after 7 days

### User Roles

- **user** - Standard user (default)
- **admin** - Full system access
- **moderator** - Content moderation access

---

## 6. Image Management

**Purpose**: Handle image uploads for listings

### Features

- Multiple image upload
- Image compression and resizing
- Thumbnail generation
- Base64 encoding for database storage (production)
- File system storage (development)

### Technical Implementation

**Backend**: `CueFinder.Extensions` library

**Controller**: `ImagesController`

**Storage Strategies**:
- Development: File system (`uploads/` folder)
- Production: Base64 in database (CloudFlare CDN planned)

**Limits**:
- Max file size: 5 MB
- Allowed formats: JPG, PNG, WEBP
- Max images per listing: 10

---

## 7. Content Moderation

**Purpose**: Manage inappropriate content and user reports

### Features

- Image flagging system
- User reporting
- Moderation queue
- Admin dashboard

### Technical Implementation

**Backend**: `CueFinderModerator` service

**Database Entities**:
- `FlaggedImage`
- `UserReport`
- `ModerationQueue`

**Workflow**:
1. User flags content
2. Enters moderation queue
3. Moderator reviews
4. Approved or removed

---

## 8. Search & Filters

### Advanced Filtering

All marketplace features support:
- Text search (title, description)
- Brand filter
- Price range
- Condition filter
- Location-based search (planned)
- Saved searches (planned)

### Implementation

**Query Building**:
```csharp
var query = _context.Cues.AsQueryable();

if (!string.IsNullOrEmpty(brand))
    query = query.Where(c => c.Brand == brand);

if (minPrice.HasValue)
    query = query.Where(c => c.Price >= minPrice);

if (maxPrice.HasValue)
    query = query.Where(c => c.Price <= maxPrice);

return await query.ToListAsync();
```

**Performance**:
- Database indexes on filter columns
- Pagination for large result sets
- `.AsNoTracking()` for read-only queries

---

## 9. Internationalization

**Purpose**: Multi-language support

### Supported Languages

- English (default)
- Greek (primary market)

### Implementation

**Frontend**: i18next library

**Translation Files**:
- `CueFinderFE/packages/app/src/locales/en.json`
- `CueFinderFE/packages/app/src/locales/gr.json`

**Usage**:
```javascript
const { t } = useTranslation();
<h1>{t('raffles.title')}</h1>
```

---

## Future Features (Roadmap)

### Phase 2 (Q3 2026)
- [ ] Real-time messaging (WebSockets)
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Advanced search with Elasticsearch
- [ ] Location-based search with maps

### Phase 3 (Q4 2026)
- [ ] Video uploads
- [ ] Live streaming for raffle draws
- [ ] Escrow service for payments
- [ ] Shipping integration
- [ ] Analytics dashboard for sellers

### Phase 4 (2027)
- [ ] Machine learning fraud detection
- [ ] Automated price suggestions
- [ ] Cue builder tool
- [ ] Virtual cue rack (AR/VR)

---

Last Updated: April 2, 2026
