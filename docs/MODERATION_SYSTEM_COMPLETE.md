# 🛡️ Image Moderation System - Complete Implementation Guide

## Overview

Complete open-source image moderation system with:
- ✅ AI-powered image scanning (NudeNet - nudity/unsafe content)
- ✅ Image hashing & duplicate detection
- ✅ Temporary storage (moderation queue)
- ✅ Admin dashboard for approvals
- ✅ User reporting system
- ✅ User banning capabilities

---

## Architecture

```
React Upload
    ↓
C# API (/api/moderation/upload-image)
    ↓
Temporary Storage (/uploads/temp) - NOT public
    ↓
NudeNet AI Scan (Docker microservice)
    ↓
✔ OK → Approved Storage (/uploads/approved)
❌ Unsafe → Flagged + Moderation Queue
    ↓
Admin Dashboard Review
    ↓
Approve (publish) / Reject (ban user, delete)
```

---

## Database Schema

### FlaggedImages Table
```sql
CREATE TABLE flagged_images (
  id INTEGER PRIMARY KEY,
  image_hash VARCHAR(256) NOT NULL UNIQUE,
  file_name VARCHAR(500) NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  cue_id INTEGER NULLABLE,
  cue_case_id INTEGER NULLABLE,
  user_id INTEGER NOT NULL,
  flag_reason VARCHAR(50), -- 'nudity', 'violence', 'weapons', 'other'
  ai_confidence_score DOUBLE NULLABLE,
  is_ai_flagged BOOLEAN DEFAULT true,
  status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  admin_user_id INTEGER NULLABLE,
  flagged_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP NULLABLE,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_user_id) REFERENCES users(id),
  FOREIGN KEY (cue_id) REFERENCES cues(id),
  FOREIGN KEY (cue_case_id) REFERENCES cue_cases(id)
);
```

### ModerationQueue Table
```sql
CREATE TABLE moderation_queues (
  id INTEGER PRIMARY KEY,
  flagged_image_id INTEGER NOT NULL,
  priority INTEGER DEFAULT 2, -- 1=high, 2=medium, 3=low
  user_report_count INTEGER DEFAULT 0,
  is_being_reviewed BOOLEAN DEFAULT false,
  reviewing_admin_id INTEGER NULLABLE,
  review_started_at TIMESTAMP NULLABLE,
  added_to_queue_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (flagged_image_id) REFERENCES flagged_images(id),
  FOREIGN KEY (reviewing_admin_id) REFERENCES users(id)
);
```

### UserReports Table
```sql
CREATE TABLE user_reports (
  id INTEGER PRIMARY KEY,
  reporting_user_id INTEGER NOT NULL,
  flagged_image_id INTEGER NOT NULL,
  report_reason VARCHAR(500),
  reported_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (reporting_user_id) REFERENCES users(id),
  FOREIGN KEY (flagged_image_id) REFERENCES flagged_images(id)
);
```

---

## Installation Steps

### 1. Apply Database Migration

```bash
cd CueFinderBE
dotnet ef database update
```

This creates:
- `FlaggedImages` table
- `ModerationQueues` table  
- `UserReports` table
- All necessary indexes for performance

### 2. Update appsettings.json

Add moderation configuration:

```json
{
  "Moderation": {
    "NudeNetUrl": "http://localhost:8001",
    "MaxImageSize": 5242880,
    "AllowedMimes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
    "ConfidenceThreshold": 0.6,
    "TempStoragePath": "uploads/temp",
    "ApprovedStoragePath": "uploads/approved"
  }
}
```

### 3. Build and Start Services

```bash
# From project root
docker-compose up -d --build

# This starts:
# - PostgreSQL (5432)
# - NudeNet AI (8001)
# - C# Backend (5000)
# - React Frontend (3000)
```

---

## API Endpoints

### Upload Image (Protected)
```
POST /api/moderation/upload-image
Headers: Authorization: Bearer {token}
Body: FormData
  - file: image file
  - cueId?: number (optional)
  - cueCaseId?: number (optional)

Response 200:
{
  "message": "Image uploaded successfully",
  "filename": "uuid_filename.jpg",
  "url": "/uploads/approved/uuid_filename.jpg",
  "size": 1024000
}

Response 400:
{
  "message": "Image rejected - violates content policy",
  "flag_reason": "nudity",
  "confidence": 0.87
}
```

### Get Pending Flags (Admin Only)
```
GET /api/moderation/pending?limit=50
Headers: Authorization: Bearer {token}

Response 200:
{
  "total": 5,
  "items": [
    {
      "id": 1,
      "reason": "nudity",
      "confidence": 0.85,
      "is_ai": true,
      "user_id": 42,
      "user_name": "john_doe",
      "cue_id": 123,
      "cue_case_id": null,
      "flagged_at": "2026-01-21T10:30:00Z",
      "storage_path": "/app/uploads/temp/uuid_filename.jpg"
    }
  ]
}
```

### Approve Flag (Admin Only)
```
POST /api/moderation/approve/{flagId}
Headers: Authorization: Bearer {token}
Body: {
  "notes": "Looks fine to me"
}

Response 200:
{
  "message": "Flag approved"
}
```

### Reject Flag (Admin Only)
```
POST /api/moderation/reject/{flagId}
Headers: Authorization: Bearer {token}
Body: {
  "notes": "Violates policy",
  "ban_user": true
}

Response 200:
{
  "message": "Flag rejected"
}
```

### Report Image (Authenticated Users)
```
POST /api/moderation/report/{flagId}
Headers: Authorization: Bearer {token}
Body: {
  "reason": "Additional rule violation"
}

Response 200:
{
  "message": "Image reported"
}
```

---

## NudeNet Microservice

### How It Works

The NudeNet service runs as a separate Docker container:

```dockerfile
# Dockerfile.nudenet
FROM python:3.11-slim
WORKDIR /app
RUN pip install nudenet fastapi uvicorn
COPY nudenet_service.py .
EXPOSE 8000
CMD ["python", "nudenet_service.py"]
```

### API

```
GET /health
Response: {"status": "healthy", "service": "nudenet-moderation"}

POST /scan
Body: FormData { file: image }
Response: {
  "unsafe": true,
  "scores": {
    "unsafe": 0.87,
    "safe": 0.13
  }
}
```

### Local Testing

```bash
# Build image
docker build -f deployment/Dockerfile.nudenet -t cuefinder-nudenet .

# Run container
docker run -d \
  --name nudenet \
  -p 8001:8000 \
  -v ~/.cache:/root/.cache \
  cuefinder-nudenet

# Test
curl -X POST \
  -F "file=@test-image.jpg" \
  http://localhost:8001/scan
```

---

## Frontend Integration

### Upload Component Example

```jsx
import { useState } from 'react';

export function ImageUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/moderation/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onUploadSuccess(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <button type="submit" disabled={!file || loading}>
        {loading ? 'Checking...' : 'Upload'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### Admin Dashboard

Located at: [ModerationDashboard.jsx](../CueFinderFE/cuefinderfe/src/components/ModerationDashboard.jsx)

Features:
- Real-time pending flags list
- Flag preview with confidence scores
- Approve/Reject buttons
- Optional user banning
- Admin notes tracking

---

## Security Best Practices

### 1. ✅ Temporary Storage
- Images stored in non-public `/uploads/temp`
- Not accessible via HTTP
- Deleted after moderation

### 2. ✅ File Validation
```csharp
// MIME type check
var allowedMimes = new[] { "image/jpeg", "image/png", "image/webp" };
if (!allowedMimes.Contains(file.ContentType))
    return BadRequest("Invalid file type");

// Magic bytes check (implement in production)
// Read first 16 bytes to verify actual file type

// Size limit
if (file.Length > 5 * 1024 * 1024)
    return BadRequest("File too large");
```

### 3. ✅ Image Hashing
```csharp
// Prevent duplicate uploads (even modified versions)
var hash = GenerateImageHash(imagePath); // MD5 or pHash
var existing = await _db.FlaggedImages
    .FirstOrDefaultAsync(f => f.ImageHash == hash);
```

### 4. ✅ Rate Limiting (in production)
```csharp
// Add to Startup
services.AddRateLimiting(options =>
{
    options.RateLimitPolicy = "upload_policy";
});

// Limit: 10 uploads per user per hour
```

### 5. ✅ Randomized Filenames
```csharp
var filename = $"{Guid.NewGuid()}_{file.FileName}";
// Prevents directory traversal attacks
```

---

## Scaling Considerations (Hetzner)

### CPU-Optimized Machine (for NudeNet)
- **Type**: CCX23 (4 vCPU, 16GB RAM)
- **Cost**: €29.90/month
- **Throughput**: ~10-15 images/second

### GPU Machine (optional, much faster)
- **Type**: GPX33 (2x RTX 4090, 48GB VRAM)
- **Cost**: €800-1000/month
- **Throughput**: ~100+ images/second

### Production Setup
```yaml
# docker-compose.prod.yml
services:
  nudenet:
    image: cuefinder-nudenet:latest
    deploy:
      replicas: 2 # Multiple instances behind load balancer
    resources:
      limits:
        cpus: '2'
        memory: '8G'

  backend:
    depends_on:
      - nudenet
```

---

## Monitoring & Logs

### Check NudeNet Service
```bash
# Logs
docker logs cuefinder-nudenet --tail 50 -f

# Health check
curl http://localhost:8001/health

# Performance
docker stats cuefinder-nudenet
```

### Database Queries
```sql
-- Pending flags
SELECT id, reason, is_ai_flagged, flagged_at, user_id 
FROM flagged_images 
WHERE status = 'pending'
ORDER BY flagged_at DESC;

-- Flagged by AI in last 24h
SELECT flag_reason, COUNT(*) as count
FROM flagged_images
WHERE is_ai_flagged = true
  AND flagged_at > NOW() - INTERVAL '1 day'
GROUP BY flag_reason;

-- Most reported users
SELECT u.username, COUNT(f.id) as violations
FROM users u
INNER JOIN flagged_images f ON u.id = f.user_id
WHERE f.status = 'rejected'
GROUP BY u.id, u.username
ORDER BY violations DESC;
```

---

## Testing

### Manual Testing
```bash
# Test upload (requires auth token)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg" \
  http://localhost:5000/api/moderation/upload-image

# Get pending
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/moderation/pending

# Approve
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Approved"}' \
  http://localhost:5000/api/moderation/approve/1
```

### Unit Tests (example)
```csharp
[TestFixture]
public class ModerationServiceTests
{
    private IModerationService _service;

    [Test]
    public async Task ScanImage_WithUnsafeImage_ReturnsFlagged()
    {
        // Arrange
        var imagePath = "test-unsafe.jpg";

        // Act
        var result = await _service.ScanImageAsync(imagePath, userId: 1);

        // Assert
        Assert.IsTrue(result.IsUnsafe);
        Assert.AreEqual("nudity", result.FlagReason);
    }
}
```

---

## Troubleshooting

### NudeNet Service Won't Start
```bash
# Check logs
docker logs cuefinder-nudenet

# Common issue: Port 8001 already in use
sudo lsof -i :8001
kill -9 <PID>

# Rebuild image
docker build -f deployment/Dockerfile.nudenet -t cuefinder-nudenet:latest .
docker-compose up -d --build nudenet
```

### Backend Can't Connect to NudeNet
```bash
# Check network connectivity
docker exec cuefinder-backend \
  curl -v http://nudenet:8000/health

# Check configuration
grep "NudeNetUrl" CueFinderBE/appsettings.json
```

### Database Migration Failed
```bash
# Rollback
dotnet ef database update 0

# Reapply
dotnet ef database update
```

---

## Next Steps

1. **Implement pHash for better duplicate detection**
   - Current: MD5 hash
   - Better: Perceptual Hash (tolerant to modifications)

2. **Add violence/weapons detection**
   - Use OpenCLIP + pre-trained classifiers
   - Run in separate NudeNet-like microservice

3. **User appeals system**
   - Allow users to appeal rejections
   - Admin re-review workflow

4. **Automated moderation actions**
   - Ban users after N violations
   - Automatic flagging based on patterns

5. **Analytics dashboard**
   - Violations by category
   - False positive rates
   - Time to moderation

---

## Support

For issues:
1. Check logs: `docker logs cuefinder-nudenet`
2. Verify NudeNet health: `curl http://localhost:8001/health`
3. Check database: `docker exec cuefinder-postgres psql ...`

