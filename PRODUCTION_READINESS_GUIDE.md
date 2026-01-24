# Production Readiness Guide for CueFinder

## Overview
This document outlines the remaining steps needed to make CueFinder production-ready, with priority levels and implementation guides.

---

## 🔴 CRITICAL - Must Complete Before Production

### 1. HTTPS/SSL Configuration

**Current State:**
- Backend configured for HTTP only (`http://+:5000` in Program.cs)
- Nginx SSL configuration exists but needs certificates
- No SSL certificates configured

**Required Actions:**

#### A. Generate SSL Certificates (Choose One):

**Option 1: Cloudflare Origin Certificate (Recommended if using Cloudflare)**
```bash
# 1. Log in to Cloudflare Dashboard
# 2. Go to SSL/TLS → Origin Server
# 3. Click "Create Certificate"
# 4. Download both files:
#    - origin-cert.pem (Certificate)
#    - origin-key.pem (Private Key)
# 5. Upload to server at: /etc/nginx/ssl/
```

**Option 2: Let's Encrypt (Free, Auto-Renewal)**
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d billiardscuefinder.com -d www.billiardscuefinder.com

# Certificates will be at:
# /etc/letsencrypt/live/billiardscuefinder.com/fullchain.pem
# /etc/letsencrypt/live/billiardscuefinder.com/privkey.pem
```

**Option 3: Self-Signed (Development/Testing Only)**
```bash
# Generate self-signed certificate (NOT for production)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/selfsigned.key \
  -out /etc/nginx/ssl/selfsigned.crt
```

#### B. Update Nginx Configuration:

**For Cloudflare:**
```nginx
# nginx-ssl.conf already configured correctly
ssl_certificate /etc/nginx/ssl/origin-cert.pem;
ssl_certificate_key /etc/nginx/ssl/origin-key.pem;
```

**For Let's Encrypt:**
```nginx
ssl_certificate /etc/letsencrypt/live/billiardscuefinder.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/billiardscuefinder.com/privkey.pem;
```

#### C. Update Backend for HTTPS:

**Update Program.cs** (line ~185):
```csharp
// Change from:
app.UseHttpsRedirection();

// To (for production behind nginx):
if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders(); // Trust proxy headers
}
```

**Add to builder services** (before `var app = builder.Build();`):
```csharp
// Configure forwarded headers for nginx proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
```

#### D. Update Environment Variables:

**.env.production:**
```env
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
BACKEND_URL=https://billiardscuefinder.com
```

**appsettings.Production.json:**
```json
{
  "CorsOrigins": {
    "Frontend": "https://billiardscuefinder.com"
  }
}
```

#### E. Deploy and Test:
```bash
# 1. Deploy with SSL-enabled nginx config
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 2. Test HTTPS endpoint
curl -I https://billiardscuefinder.com/health

# 3. Verify SSL certificate
openssl s_client -connect billiardscuefinder.com:443 -servername billiardscuefinder.com
```

---

## 🟡 HIGH PRIORITY - Should Complete Soon

### 2. Forum User ID Type Mismatch

**Current Issue:**
- Forum tables use `Guid` for `CreatedByUserId`
- Main Users table uses `int` for `Id`
- Current workaround: Converting int IDs to Guid using MD5 hash
- TODO comment at line 309 in ForumController.cs

**Impact:**
- Cannot directly join Users and Forum tables
- Cannot fetch user details (name, phone) for forum posts
- Displaying "User" as default for all posts

**Recommended Solution:**

**Option A: Add User Lookup Service (Recommended - No Schema Change)**

Create a user lookup service that bridges the gap:

```csharp
// Add to CueFinder.Forum/Services/IUserLookupService.cs
public interface IUserLookupService
{
    Task<UserInfo> GetUserInfoAsync(Guid forumUserId);
    Guid ConvertUserIdToGuid(int userId);
    Task<int?> ConvertGuidToUserId(Guid forumUserId);
}

public class UserInfo
{
    public int UserId { get; set; }
    public string Username { get; set; }
    public string Phone { get; set; }
    public string Name { get; set; }
}

// Implementation
public class UserLookupService : IUserLookupService
{
    private readonly CueFinderDbContext _dbContext;
    private readonly IMemoryCache _cache;

    public async Task<UserInfo> GetUserInfoAsync(Guid forumUserId)
    {
        // Check cache first
        if (_cache.TryGetValue($"user_{forumUserId}", out UserInfo cachedUser))
            return cachedUser;

        // Try to find by mapping table or reverse MD5
        var user = await _dbContext.Users
            .Where(u => /* matching logic */)
            .Select(u => new UserInfo { UserId = u.Id, Username = u.Username, Phone = u.Phone })
            .FirstOrDefaultAsync();

        _cache.Set($"user_{forumUserId}", user, TimeSpan.FromMinutes(30));
        return user ?? new UserInfo { Username = "User" };
    }
}
```

**Update ForumController.cs**:
```csharp
// Replace line 309:
CreatedByUserPhone = "User", // TODO: Link forum posts to actual user IDs

// With:
var userInfo = await _userLookupService.GetUserInfoAsync(p.CreatedByUserId);
CreatedByUserPhone = userInfo.Phone,
```

**Option B: Database Schema Migration (More Invasive)**

Add mapping table:
```sql
CREATE TABLE "ForumUserMapping" (
    "ForumUserId" uuid PRIMARY KEY,
    "ActualUserId" int NOT NULL,
    FOREIGN KEY ("ActualUserId") REFERENCES "Users"("Id")
);

CREATE INDEX "IX_ForumUserMapping_ActualUserId" ON "ForumUserMapping"("ActualUserId");
```

---

### 3. Moderation Service Configuration

**Current State:**
```json
// appsettings.Production.json
"ModerationServiceUrl": "https://moderation-service-url"
```

**Required Actions:**

**Option A: Use Deployed Moderation Service**
If you have CueFinderModerator deployed:
```json
"ModerationServiceUrl": "https://moderation.billiardscuefinder.com"
```

**Option B: Internal Docker Service**
If moderation runs as Docker container:
```json
"ModerationServiceUrl": "http://cuefinder-moderator-prod:5001"
```

**Option C: Disable for Now**
If moderation not yet deployed:
```json
"ModerationServiceUrl": ""
```

And update ModerationController to handle missing service:
```csharp
if (string.IsNullOrEmpty(_moderationServiceUrl))
{
    _logger.LogWarning("Moderation service not configured");
    return Ok(new { status = "disabled", message = "Moderation service not configured" });
}
```

---

## 🟢 RECOMMENDED - Enhance Production Quality

### 4. Additional Production Hardening

#### A. Database Connection Pooling
```json
// appsettings.Production.json
"ConnectionStrings": {
  "DefaultConnection": "Host=postgres;Port=5432;Database=cuefinder;Username=postgres;Password=${DB_PASSWORD};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=50;"
}
```

#### B. Logging Configuration
```json
"Logging": {
  "LogLevel": {
    "Default": "Warning",
    "Microsoft": "Warning",
    "Microsoft.EntityFrameworkCore": "Warning"
  }
}
```

#### C. Health Checks
Already implemented at `/health` endpoint - good!

#### D. Rate Limiting
Already implemented in Program.cs - good!

---

## Deployment Checklist

Before going live:

- [ ] SSL certificates generated and installed
- [ ] Nginx SSL configuration updated with correct certificate paths
- [ ] Backend configured to trust proxy headers
- [ ] All HTTPS URLs updated in .env.production
- [ ] Forum user lookup service implemented (or TODO comment addressed)
- [ ] Moderation service URL configured or disabled gracefully
- [ ] Database passwords rotated (never use the exposed secrets!)
- [ ] JWT secrets rotated (never use the exposed secrets!)
- [ ] Test HTTPS endpoints: `curl -I https://billiardscuefinder.com/health`
- [ ] Test forum post creation with user details
- [ ] Test image uploads over HTTPS
- [ ] Monitor logs for errors after deployment
- [ ] Set up automated SSL certificate renewal (if using Let's Encrypt)

---

## Quick Start Commands

```bash
# 1. Generate new production secrets
pwsh -Command "[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))"

# 2. Deploy with SSL
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# 4. Verify HTTPS
curl -I https://billiardscuefinder.com/api/health

# 5. Test forum with authentication
curl -X POST https://billiardscuefinder.com/api/forum/discussions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content","categoryId":"YOUR_CATEGORY_ID"}'
```

---

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify database: `docker exec postgres psql -U postgres -d cuefinder -c "SELECT version();"`
3. Test endpoints: `curl -v https://billiardscuefinder.com/health`
