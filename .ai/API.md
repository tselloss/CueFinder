# API Documentation

Complete API reference for CueFinder backend services.

## Base URL

- **Development**: `https://localhost:5000/api`
- **Production**: `https://api.cuefinder.com/api`

## Authentication

Most endpoints require authentication using **JWT Bearer tokens**.

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### Using the Token

Include the token in the `Authorization` header:

```http
GET /api/raffles/my-raffles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## API Endpoints

### Authentication

#### Register New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+306912345678"
}
```

**Response:** 201 Created
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "johndoe", ... }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:** 200 OK

### Raffles

#### Get All Raffles

```http
GET /api/raffles?status=open
```

**Query Parameters:**
- `status` (optional): Filter by status (`open`, `closed`, `drawn`, `cancelled`)

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "organizerId": 10,
    "organizerName": "John Seller",
    "title": "Predator BK3 Break Cue",
    "description": "Like new condition...",
    "itemImageUrl": "/uploads/raffles/image.jpg",
    "totalSpots": 100,
    "pricePerSpot": 10.00,
    "endsAt": "2026-05-01T00:00:00Z",
    "autoEndWhenFull": true,
    "paymentMethods": {
      "paypal": true,
      "revolut": true,
      "bankTransfer": false,
      "viva": false,
      "iris": false,
      "dm": true
    },
    "paymentDetails": "PayPal: seller@email.com",
    "status": "open",
    "claimedSpots": 45,
    "paidSpots": 42,
    "winnerId": null,
    "winnerName": null,
    "createdAt": "2026-04-01T10:00:00Z"
  }
]
```

#### Get Raffle by ID

```http
GET /api/raffles/1
```

**Response:** 200 OK or 404 Not Found

#### Get My Raffles (Authenticated)

```http
GET /api/raffles/my-raffles
Authorization: Bearer {token}
```

**Response:** 200 OK - Array of raffles created by current user

#### Get My Entries (Authenticated)

```http
GET /api/raffles/my-entries
Authorization: Bearer {token}
```

**Response:** 200 OK - Array of raffles user has entered

#### Create Raffle (Authenticated)

```http
POST /api/raffles
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Predator BK3 Break Cue",
  "description": "Excellent condition, barely used",
  "itemImageUrl": "/uploads/raffles/cue.jpg",
  "totalSpots": 100,
  "pricePerSpot": 10.00,
  "endsAt": "2026-05-01T00:00:00Z",
  "autoEndWhenFull": true,
  "acceptPayPal": true,
  "acceptRevolut": true,
  "acceptBankTransfer": false,
  "acceptViva": false,
  "acceptIris": false,
  "acceptDM": true,
  "paymentDetails": "PayPal: seller@email.com\nRevolut: @sellername"
}
```

**Response:** 201 Created

#### Update Raffle (Authenticated)

```http
PUT /api/raffles/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response:** 200 OK or 400 Bad Request (if raffle has active bookings)

#### Delete Raffle (Authenticated)

```http
DELETE /api/raffles/1
Authorization: Bearer {token}
```

**Response:** 204 No Content or 400 Bad Request (if raffle has active bookings)

#### Enter Raffle (Authenticated)

```http
POST /api/raffles/1/enter
Authorization: Bearer {token}
Content-Type: application/json

{
  "spotNumber": 42
}
```

**Response:** 200 OK or 400 Bad Request (spot taken/invalid)

#### Verify Payment (Authenticated, Organizer Only)

```http
POST /api/raffles/1/entries/5/verify
Authorization: Bearer {token}
```

**Response:** 200 OK

#### Draw Winner (Authenticated, Organizer Only)

```http
POST /api/raffles/1/draw
Authorization: Bearer {token}
```

**Response:** 200 OK with winner details

### Cues

#### Get All Cues

```http
GET /api/cues?brand=Predator&cueType=playing&minPrice=100&maxPrice=500&isSold=false&page=1&pageSize=20
```

**Query Parameters:**
- `brand` (optional): Filter by brand
- `cueType` (optional): Filter by type (playing, break, jump)
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `isSold` (optional): Filter by sold status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Response:** 200 OK
```json
{
  "items": [
    {
      "id": 1,
      "title": "Predator P3",
      "brand": "Predator",
      "description": "Excellent playing cue",
      "price": 350.00,
      "cueType": "playing",
      "weight": 19.0,
      "length": 58.0,
      "tipSize": 13.0,
      "shaftMaterial": "Maple",
      "wrapMaterial": "Irish Linen",
      "condition": "excellent",
      "location": "Athens, Greece",
      "isSold": false,
      "userId": 5,
      "userName": "John Seller",
      "images": ["/uploads/cues/image1.jpg"],
      "viewCount": 150,
      "createdAt": "2026-03-15T10:00:00Z"
    }
  ],
  "totalCount": 45,
  "page": 1,
  "pageSize": 20
}
```

#### Get Cue by ID

```http
GET /api/cues/1
```

**Response:** 200 OK or 404 Not Found

#### Create Cue (Authenticated)

```http
POST /api/cues
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Predator P3",
  "brand": "Predator",
  "description": "Excellent condition",
  "price": 350.00,
  "cueType": "playing",
  "weight": 19.0,
  "length": 58.0,
  "tipSize": 13.0,
  "shaftMaterial": "Maple",
  "wrapMaterial": "Irish Linen",
  "condition": "excellent",
  "location": "Athens, Greece",
  "images": [
    {
      "imageUrl": "/uploads/cues/image1.jpg",
      "altText": "Front view"
    }
  ]
}
```

**Response:** 201 Created

#### Update Cue (Authenticated, Owner Only)

```http
PUT /api/cues/1
Authorization: Bearer {token}
Content-Type: application/json

{ "price": 300.00, "description": "Price reduced!" }
```

**Response:** 200 OK

#### Delete Cue (Authenticated, Owner Only)

```http
DELETE /api/cues/1
Authorization: Bearer {token}
```

**Response:** 204 No Content

#### Mark as Sold (Authenticated, Owner Only)

```http
POST /api/cues/1/sold
Authorization: Bearer {token}
```

**Response:** 200 OK

### Messages

#### Get Conversations

```http
GET /api/messages/conversations
Authorization: Bearer {token}
```

**Response:** 200 OK
```json
[
  {
    "otherUserId": 5,
    "otherUserName": "John Doe",
    "lastMessage": "Is this still available?",
    "lastMessageAt": "2026-04-02T15:30:00Z",
    "unreadCount": 2
  }
]
```

#### Get Messages with User

```http
GET /api/messages/user/5
Authorization: Bearer {token}
```

**Response:** 200 OK - Array of messages

#### Send Message

```http
POST /api/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": 5,
  "subject": "Question about Predator cue",
  "body": "Is this still available?"
}
```

**Response:** 201 Created

#### Mark as Read

```http
POST /api/messages/5/read
Authorization: Bearer {token}
```

**Response:** 200 OK

### Forum

#### Get Categories

```http
GET /api/forum/categories
```

**Response:** 200 OK

#### Get Posts in Category

```http
GET /api/forum/categories/1/posts?page=1&pageSize=20
```

**Response:** 200 OK

#### Create Post

```http
POST /api/forum/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "categoryId": 1,
  "title": "Best break cue?",
  "content": "Looking for recommendations..."
}
```

**Response:** 201 Created

#### Reply to Post

```http
POST /api/forum/posts/1/replies
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "I recommend the Predator BK3"
}
```

**Response:** 201 Created

### Users

#### Get User Profile

```http
GET /api/users/5
```

**Response:** 200 OK
```json
{
  "id": 5,
  "username": "johndoe",
  "name": "John Doe",
  "bio": "Billiards enthusiast",
  "location": "Athens, Greece",
  "profilePictureUrl": "/uploads/profiles/john.jpg",
  "joinedAt": "2025-01-15T00:00:00Z",
  "averageRating": 4.8,
  "totalRatings": 12
}
```

#### Update Profile (Authenticated)

```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Updated bio",
  "location": "Thessaloniki, Greece"
}
```

**Response:** 200 OK

#### Get User Ratings

```http
GET /api/users/5/ratings
```

**Response:** 200 OK - Array of ratings

#### Rate User (Authenticated)

```http
POST /api/users/5/ratings
Authorization: Bearer {token}
Content-Type: application/json

{
  "score": 5,
  "comment": "Great seller, fast shipping!"
}
```

**Response:** 201 Created

## Error Responses

All endpoints return consistent error formats:

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "Price": ["Price must be positive"],
    "Title": ["Title is required"]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "An error occurred while processing your request"
}
```

## Rate Limiting

- **Anonymous users**: 100 requests per hour
- **Authenticated users**: 1000 requests per hour
- **Admin users**: Unlimited

## CORS

Allowed origins:
- `http://localhost:5173` (development)
- `https://cuefinder.com` (production)

## Pagination

List endpoints support pagination:

```http
GET /api/cues?page=2&pageSize=50
```

**Response includes:**
```json
{
  "items": [...],
  "totalCount": 250,
  "page": 2,
  "pageSize": 50,
  "totalPages": 5
}
```

## File Uploads

Image uploads use multipart/form-data:

```http
POST /api/images/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="cue.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary--
```

**Response:**
```json
{
  "imageUrl": "/uploads/cues/550e8400-e29b-41d4-a716-446655440000.jpg",
  "thumbnailUrl": "/uploads/cues/thumb_550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

## WebSocket (Future)

Real-time messaging will use WebSocket:

```javascript
const ws = new WebSocket('wss://api.cuefinder.com/ws');
ws.send(JSON.stringify({ type: 'message', data: {...} }));
```

---

Last Updated: April 2, 2026
