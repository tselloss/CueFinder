# Caching Strategy - Backend & Frontend

## Current Backend Caching Status ✅

### What's Already Configured

The backend has caching **already enabled** via the `AddCueFinderCaching()` extension in `Program.cs`:

```csharp
// Add caching services
builder.Services.AddCueFinderCaching(builder.Configuration);
```

This is configured in `CueFinder.Extensions.Caching` library.

### How Backend Caching Works

The backend likely uses **Response Caching** or **Output Caching** middleware. This means:

1. **First Request**: Backend queries database → Returns data → Stores in cache
2. **Subsequent Requests**: Backend returns cached data → Much faster
3. **Cache Headers**: Backend sends HTTP cache headers to clients

### What You Need to Verify

Check the backend caching configuration to ensure it's sending proper HTTP cache headers:

#### Expected HTTP Response Headers:
```
Cache-Control: public, max-age=300
ETag: "abc123"
Vary: Accept-Encoding
```

#### Test with cURL or Postman:
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/cues" -Method GET -Headers @{"Authorization"="Bearer YOUR_TOKEN"}
```

Look for `Cache-Control` header in the response.

## Frontend Caching Strategy

### 1. Browser HTTP Caching (Already Working) ✅

If backend sends proper cache headers, the browser **automatically caches** responses.

**No frontend code changes needed!**

#### How it works:
```
User Request → Browser checks cache → If valid, use cached data
                                    → If expired, fetch from server
```

#### Benefits:
- Automatic
- No code changes
- Works across all browsers
- Respects cache headers from backend

### 2. Verify Frontend is Using Cache

The frontend's `httpClient.js` uses native `fetch()` API which respects HTTP cache headers automatically.

```javascript
const response = await fetch(url, {
  method,
  headers: finalHeaders,
  // No cache options needed - browser handles it
});
```

### 3. Testing Frontend Cache

#### Method 1: Browser DevTools
1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Make a request (e.g., view cue details)
4. Refresh page (`F5`)
5. Look for:
   - **Status**: `200 (from memory cache)` or `304 Not Modified`
   - **Time**: Much faster (5-10ms vs 100-150ms)
   - **Size**: `(from cache)` or `(from memory)`

#### Method 2: Check Response Headers
1. Click on a network request in DevTools
2. Go to **Headers** tab
3. Look for:
   ```
   Cache-Control: public, max-age=300
   ETag: "..."
   Age: 45
   ```

### 4. What About Redis Caching?

The backend might use Redis for **distributed caching** (caching on the server side).

#### Redis Setup (If Needed)

Check `docker-compose.yml` or `docker-compose.dev.yml` for Redis service:

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    
volumes:
  redis_data:
```

Check backend configuration in `appsettings.json`:

```json
{
  "Caching": {
    "Provider": "Redis",
    "Redis": {
      "Configuration": "localhost:6379",
      "InstanceName": "CueFinder:"
    }
  }
}
```

## Caching Recommendations

### For Backend ✅ (Already Done)

The backend caching is configured. Just verify:

1. **Check Response Headers**
   ```bash
   curl -I http://localhost:5000/api/cues
   ```
   Should show `Cache-Control` header

2. **Ensure Cache is Working**
   - First request: Normal database query time
   - Second request: Much faster (from cache)

### For Frontend ✅ (No Changes Needed)

The frontend automatically respects cache headers. No code changes needed!

#### If You Want More Control (Optional):

```javascript
// Force fresh data (bypass cache)
fetch(url, { cache: 'no-cache' })

// Use cache if available
fetch(url, { cache: 'default' })

// Always use cache, even if stale
fetch(url, { cache: 'force-cache' })
```

### Caching Best Practices

1. **Don't cache authenticated endpoints** with long TTL
   - User data: Short TTL (60s) or no cache
   - Public data: Longer TTL (300s-3600s)

2. **Use ETag for conditional requests**
   - Backend generates ETag
   - Frontend sends `If-None-Match` header
   - Backend returns `304 Not Modified` if unchanged

3. **Cache busting for updates**
   - After creating/updating data, invalidate cache
   - Use cache tags or clear specific entries

4. **Consider different cache strategies**
   - **Cue listings**: Cache for 5 minutes
   - **User profile**: Cache for 1 minute
   - **Static data**: Cache for 1 hour
   - **Search results**: Don't cache or very short TTL

## Testing the Complete Caching Flow

### Test 1: Verify Backend Cache

```bash
# PowerShell
# First request
Measure-Command { 
  Invoke-WebRequest "http://localhost:5000/api/cues/1" 
}

# Second request (should be faster)
Measure-Command { 
  Invoke-WebRequest "http://localhost:5000/api/cues/1" 
}
```

### Test 2: Verify Browser Cache

1. Open app in browser
2. Open DevTools → Network tab
3. Navigate to a cue detail page
4. Note the request time (e.g., 150ms)
5. Refresh the page (`F5`)
6. Check if request is:
   - Served from cache (`from memory cache`)
   - Or faster with `304 Not Modified`

### Test 3: Check Cache Headers

```javascript
// In browser console
fetch('/api/cues/1')
  .then(res => {
    console.log('Cache-Control:', res.headers.get('cache-control'));
    console.log('ETag:', res.headers.get('etag'));
    console.log('Age:', res.headers.get('age'));
    return res.json();
  })
  .then(data => console.log('Data:', data));
```

## Common Issues & Solutions

### Issue: Cache Not Working

**Check:**
1. Backend sending cache headers? → Check response headers
2. HTTPS required? → HTTP cache works on localhost
3. Authentication issues? → Private data might not be cached
4. DevTools "Disable cache" enabled? → Disable for testing

### Issue: Stale Data After Update

**Solution:**
```javascript
// After creating/updating a cue
fetch('/api/cues', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: { 'Cache-Control': 'no-cache' }
});

// Then invalidate cache by refetching
fetch('/api/cues', { cache: 'reload' }); // Force fresh data
```

### Issue: Too Much/Too Little Caching

**Backend configuration:**
```csharp
// Adjust cache duration per endpoint
[ResponseCache(Duration = 300)] // 5 minutes
public IActionResult GetCues() { }

[ResponseCache(Duration = 60)] // 1 minute
public IActionResult GetUserProfile() { }

[ResponseCache(NoStore = true)] // Don't cache
public IActionResult CreateCue() { }
```

## Summary: What You Need to Do

### For Caching: ✅ Nothing!

1. ✅ **Backend**: Already configured with `AddCueFinderCaching()`
2. ✅ **Frontend**: Automatically respects HTTP cache headers
3. ⚠️ **Verify**: Test that caching is working (see testing section above)
4. ⚠️ **Monitor**: Check cache performance in production

### For Error Handling: ✅ Updated!

1. ✅ **httpClient.js**: Updated to parse Problem Details
2. ✅ **errorUtils.js**: Created utility functions
3. ✅ **LoginPage.js**: Updated to use error utilities
4. ✅ **UserProfile.js**: Updated to use error utilities
5. ⚠️ **Other components**: Update as needed (see migration guide)

## Next Steps

1. **Test error handling**: Try various error scenarios (invalid login, validation errors)
2. **Test caching**: Use DevTools to verify cache is working
3. **Update remaining components**: Apply error utilities to other components
4. **Monitor performance**: Check if caching improves response times

## Resources

- [HTTP Caching MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 7807 Problem Details](https://tools.ietf.org/html/rfc7807)
- [Response Caching in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/response)
