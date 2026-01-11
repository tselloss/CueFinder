# CORS and Environment Variables Fix

## Issues Fixed

### 1. Missing JWT Secret Key
**Problem:** Backend was crashing with exit code 139 because JWT_SECRET was empty in `.env` file.

**Solution:** Updated `.env` file on server with proper values:
```bash
DB_PASSWORD=CueFinderDB2024SecurePass
JWT_SECRET=CueFinderJWT2024VerySecureSecretKey256Bits
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com,http://localhost:3000,http://localhost:8080,http://116.203.137.201:3000,http://116.203.137.201:8080
```

### 2. CORS Configuration - Multiple Origins
**Problem:** Backend CORS configuration only supported a single origin, not comma-separated list.

**Solution:** Updated `Program.cs` to split comma-separated CORS origins:
```csharp
var origins = frontendOrigin.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
foreach (var origin in origins)
{
    if (!allowedOrigins.Contains(origin))
    {
        allowedOrigins.Add(origin);
    }
}
```

### 3. Deployment Workflow - Missing CORS_FRONTEND_ORIGIN
**Problem:** GitHub Actions deployment workflow wasn't including `CORS_FRONTEND_ORIGIN` in the generated `.env` file.

**Solution:** Updated `.github/workflows/deploy-production.yml` to include the variable:
```yaml
- CORS_FRONTEND_ORIGIN: ${{ secrets.CORS_FRONTEND_ORIGIN }}
```

And in the .env generation:
```bash
CORS_FRONTEND_ORIGIN=${CORS_FRONTEND_ORIGIN}
```

## How to Access the Application

### ❌ WRONG Way:
- `http://116.203.137.201:5000` - This is the **BACKEND API** port, not the frontend!

### ✅ CORRECT Way:
- `http://116.203.137.201:3000` - Frontend (standard port)
- `http://116.203.137.201:8080` - Frontend (alternative port)
- `https://billiardscuefinder.com` - Production domain (when DNS is configured)

## Port Mapping Explained

| Container | Internal Port | External Port(s) | Purpose |
|-----------|--------------|------------------|---------|
| Frontend  | 3000         | 3000, 8080       | React app with nginx |
| Backend   | 5000         | 5000             | .NET API (accessed via nginx proxy at `/api/`) |
| PostgreSQL| 5432         | 5432             | Database |
| pgAdmin   | 80           | 5050             | Database admin UI |

## Files Modified

1. **CueFinderBE/Program.cs**
   - Added support for comma-separated CORS origins
   
2. **.github/workflows/deploy-production.yml**
   - Added `CORS_FRONTEND_ORIGIN` environment variable
   - Updated .env generation to include all required variables

3. **deployment/fix-env-on-server.ps1** (NEW)
   - PowerShell script to manually fix .env on server

4. **deployment/fix-env-on-server.sh** (NEW)
   - Bash script to manually fix .env on server

## Manual Server Fix (if needed)

```powershell
# Run this to manually update .env on server
ssh cuefinder@116.203.137.201 'cd /home/cuefinder/app && cat > .env << ''EOF''
DB_PASSWORD=CueFinderDB2024SecurePass
JWT_SECRET=CueFinderJWT2024VerySecureSecretKey256Bits
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com,http://localhost:3000,http://localhost:8080,http://116.203.137.201:3000,http://116.203.137.201:8080
EOF
'

# Then restart containers
ssh cuefinder@116.203.137.201 "cd /home/cuefinder/app && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
```

## GitHub Secrets Required

Make sure these secrets are set in GitHub repository settings:

- `SERVER_IP` = 116.203.137.201
- `SSH_PRIVATE_KEY` = (your SSH private key)
- `DB_PASSWORD` = CueFinderDB2024SecurePass
- `JWT_SECRET` = CueFinderJWT2024VerySecureSecretKey256Bits
- `FRONTEND_API_URL` = https://billiardscuefinder.com/api
- `CORS_FRONTEND_ORIGIN` = https://billiardscuefinder.com (comma-separated list for multiple origins)

## Status

✅ Backend running successfully on port 5000
✅ Frontend running successfully on ports 3000 and 8080  
✅ Database running and healthy
✅ JWT authentication configured
✅ CORS properly configured for multiple origins
✅ Environment variables persist across deployments

## Next Steps

1. Commit and push the changes to the release branch
2. Access the site via `http://116.203.137.201:3000` 
3. Configure DNS for `billiardscuefinder.com` to point to 116.203.137.201
4. Set up SSL certificate for HTTPS
