# CueFinder Authentication Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUEFINDER SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐      ┌──────────────────────────────┐
│    FRONTEND (React)          │      │   BACKEND (.NET 8)           │
│  http://localhost:3000       │      │  http://localhost:5000       │
├──────────────────────────────┤      ├──────────────────────────────┤
│                              │      │                              │
│  LoginPage.js────────┐       │      │  ┌──────────────────────┐   │
│  UserProfile.js      │       │      │  │  AuthController      │   │
│  CueList.js          │       │      │  │  - POST /login       │   │
│  ...                 │       │      │  │  - POST /register    │   │
│                      │       │      │  │  - GET /me           │   │
│  ┌──────────────────▼───┐    │      │  │  - PUT /me           │   │
│  │  AuthContext         │    │      │  │  - GET /verify       │   │
│  │  (useAuth hook)      │    │      │  └──────────────────────┘   │
│  └──────────┬───────────┘    │      │           ▲                 │
│             │                │      │           │                 │
│  ┌──────────▼──────────────┐ │      │  ┌────────┴──────────────┐ │
│  │  api/authService.js    │ │      │  │  IAuthService         │ │
│  │ - login()              │ │      │  │  ITokenService        │ │
│  │ - register()           │ │      │  └────────┬──────────────┘ │
│  │ - logout()             │ │      │           │                 │
│  │ - getCurrentProfile()  │ │      │  ┌────────▼──────────────┐ │
│  │ - updateUserProfile()  │ │      │  │  Services             │ │
│  └──────────┬──────────────┘ │      │  │ - AuthService        │ │
│             │                │      │  │ - TokenService       │ │
│  ┌──────────▼──────────────┐ │      │  └────────┬──────────────┘ │
│  │ utils/httpClient.js    │ │      │           │                 │
│  │ - get()                │ │      │  ┌────────▼──────────────┐ │
│  │ - post()               │ │      │  │  In-Memory Store      │ │
│  │ - put()                │ │      │  │ (User Database)       │ │
│  │ - JWT token handling   │ │      │  │ - admin               │ │
│  │ - Auto 401 handling    │ │      │  │ - user                │ │
│  └──────────┬──────────────┘ │      │  └───────────────────────┘ │
│             │                │      │                              │
│  ┌──────────▼──────────────┐ │      │  appsettings.json           │
│  │ config/apiConfig.js    │ │      │  - JWT Secret               │
│  │ - API_ENDPOINTS        │ │      │  - Issuer/Audience          │
│  │ - API_BASE_URL         │ │      │  - Expiration               │
│  └────────────────────────┘ │      │  - CORS Origins             │
│                              │      │                              │
└──────────────┬───────────────┘      └──────────────┬───────────────┘
               │                                      │
               │         HTTP/HTTPS                  │
               └──────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                    │
└─────────────────────────────────────────────────────────────────┘

User                Frontend              Backend               Storage
 │                    │                     │                    │
 │─ Enter Creds ─────>│                     │                    │
 │                    │─ POST /login ──────>│                    │
 │                    │ {username, pass}    │                    │
 │                    │                     │─ Validate ────────>│
 │                    │                     │<─ Found ──────────│
 │                    │                     │                    │
 │                    │                     │─ Generate JWT     │
 │                    │                     │  (Token Service)   │
 │                    │                     │                    │
 │                    │<─ JWT + User Info ──│                    │
 │                    │                     │                    │
 │ Store JWT ────────>│ localStorage        │                    │
 │ Redirect to App    │                     │                    │
 │                    │                     │                    │
 │─────────────────── Subsequent Requests ────────────────────────
 │                    │                     │                    │
 │ Access Protected   │ Header:             │                    │
 │ Page              │ Auth: Bearer JWT    │                    │
 │                    │─ GET /api/cues ───>│                    │
 │                    │                     │─ Validate JWT ────>
 │                    │                     │<─ Valid ──────────│
 │                    │<─ Return Data ──────│                    │
 │<─ Display Data ────│                     │                    │
 │                    │                     │                    │
```

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              DETAILED REQUEST/RESPONSE                            │
└─────────────────────────────────────────────────────────────────┘

LOGIN REQUEST:
┌─────────────────────────────────────────┐
│ POST /api/auth/login                    │
│ Content-Type: application/json          │
│                                         │
│ {                                       │
│   "username": "user",                   │
│   "password": "password123"             │
│ }                                       │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ [Backend Validation]                    │
│ - Check credentials                     │
│ - Generate JWT token                    │
│ - Build response                        │
└─────────────────────────────────────────┘
            │
            ▼
LOGIN RESPONSE:
┌─────────────────────────────────────────┐
│ 200 OK                                  │
│ Content-Type: application/json          │
│                                         │
│ {                                       │
│   "accessToken": "eyJh...",             │
│   "userId": 1,                          │
│   "username": "user",                   │
│   "name": "User Name",                  │
│   "email": "user@example.com",          │
│   "phone": "555-1234",                  │
│   "role": "user",                       │
│   "expiresIn": 3600                     │
│ }                                       │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ [Frontend Processing]                   │
│ - Extract accessToken                   │
│ - Store in localStorage                 │
│ - Update AuthContext                    │
│ - Redirect to app                       │
└─────────────────────────────────────────┘


PROTECTED REQUEST (GET /api/auth/me):
┌─────────────────────────────────────────┐
│ GET /api/auth/me                        │
│ Authorization: Bearer eyJh...           │
│ Content-Type: application/json          │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ [Backend JWT Validation]                │
│ - Extract token from header             │
│ - Verify signature                      │
│ - Check expiration                      │
│ - Validate claims                       │
└─────────────────────────────────────────┘
            │
            ▼
PROTECTED RESPONSE:
┌─────────────────────────────────────────┐
│ 200 OK                                  │
│ Content-Type: application/json          │
│                                         │
│ {                                       │
│   "id": 1,                              │
│   "username": "user",                   │
│   "name": "User Name",                  │
│   "email": "user@example.com",          │
│   "phone": "555-1234",                  │
│   "role": "user",                       │
│   "createdAt": "2024-01-03T...",        │
│   "updatedAt": "2024-01-03T..."         │
│ }                                       │
└─────────────────────────────────────────┘
```

## JWT Token Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...        │
└─────────────────────────────────────────────────────────────────┘
  │                                  │                          │
  ├─ HEADER                          ├─ PAYLOAD                └─ SIGNATURE
  │  {                               │  {
  │    "alg": "HS256",               │    "sub": "1",
  │    "typ": "JWT"                  │    "name": "user",
  │  }                               │    "role": "user",
  │                                  │    "iss": "CueFinder",
  │                                  │    "aud": "CueFinderUsers",
  │                                  │    "exp": 1609459200,
  │                                  │    "iat": 1609455600
  │                                  │  }
  │
  ├─ Base64Url Encoded               ├─ Base64Url Encoded        └─ HMAC-SHA256(
  │                                  │                              header + payload,
  │                                  │                              secret_key
  │                                  │                           )
```

## Module Dependencies

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Program.cs                                                      │
│  │                                                               │
│  ├─ AddCommonServices()                                          │
│  │  └─ CueFinder.Common                                          │
│  │                                                               │
│  ├─ AddDataServices()                                            │
│  │  └─ CueFinder.Data                                            │
│  │                                                               │
│  ├─ AddAuthServices() ◄──────────────────────────────────────┐  │
│  │  └─ CueFinder.Auth  ◄─── IAuthService, ITokenService ──┐ │  │
│  │     ├─ AuthController                                  │ │  │
│  │     ├─ AuthService                                     │ │  │
│  │     ├─ TokenService                                    │ │  │
│  │     └─ JWT Configuration                               │ │  │
│  │                                                        │ │  │
│  ├─ AddUserServices()                                     │ │  │
│  │  └─ CueFinder.User ◄─────────────────────────────────┘ │  │
│  │                                                         │  │
│  ├─ AddCueServices()                                      │  │
│  │  └─ CueFinder.Cues                                     │  │
│  │                                                         │  │
│  ├─ AddRatingServices()                                   │  │
│  │  └─ CueFinder.Rating                                   │  │
│  │                                                         │  │
│  └─ UseCors() ◄──────────────────────────────────────────┘  │
│     └─ Allow Frontend URL (http://localhost:3000)             │
│                                                               │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW                            │
└─────────────────────────────────────────────────────────────────┘

FRONTEND                          BACKEND
├─ User enters username           ├─ Receives request
├─ User enters password           ├─ AuthController processes
├─ Click "Sign In"                ├─ AuthService validates
│                                 ├─ TokenService generates JWT
├─ authService.login()            │
├─ POST /api/auth/login           ├─ Returns JWT + user info
├─ httpClient makes request       │
├─ With headers and body          │
│                                 │
├─ Receives response              │
├─ Extract token                  │
├─ localStorage.setItem()         │
├─ AuthContext.setUser()          │
├─ Redirect to /                  │
│                                 │
├─ App renders                    │
├─ useAuth() hook reads context   │
├─ User logged in state           │
│                                 │
├─ Click protected page           │
├─ httpClient gets token          │
├─ Adds Authorization header      │
├─ Sends Bearer token             ├─ Receives request with token
│                                 ├─ [Authorize] attribute checks
│                                 ├─ TokenService validates
│                                 ├─ Claims extracted
│                                 ├─ Process request
├─ Receives protected data        ├─ Returns user-specific data
├─ Render page                    │
│                                 │
├─ Click logout                   │
├─ authService.logout()           │
├─ localStorage.removeItem()      │
├─ AuthContext.setUser(null)      │
├─ Redirect to login              │
│                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Tree

```
App (AuthProvider)
│
├─ AuthContext
│  └─ { user, login, logout, register, updateUser }
│
├─ AppInner (useAuth)
│  │
│  ├─ LoginPage (if !user)
│  │  └─ Uses: login, register, sendSms, verifySms
│  │
│  └─ (if user) Main App
│     ├─ CueList
│     │  └─ Uses: cueService.getCues()
│     ├─ CueDetail
│     │  └─ Uses: cueService.getCue()
│     ├─ CueForm
│     │  └─ Uses: cueService.createCue()
│     ├─ UserProfile
│     │  └─ Uses: authService.updateUserProfile()
│     └─ AdminPage (if user.role === 'admin')
│        └─ Uses: adminService.*()
│
└─ Footer
   └─ Static content
```
