# Production Configuration Verification Script
# Run this before deploying to production to catch configuration issues

param(
    [switch]$Fix
)

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║     🔍 Production Configuration Verification 🔍           ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# Check 1: .env.production file exists
Write-Host "📋 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    Write-Host "   ✓ .env.production file found" -ForegroundColor Green
    
    # Check for default values
    $envContent = Get-Content ".env.production" -Raw
    
    if ($envContent -match "CHANGE_THIS|your_twilio|your_email@gmail.com") {
        $warnings += "⚠️  .env.production contains default/placeholder values"
        Write-Host "   ⚠️  Warning: Default values detected in .env.production" -ForegroundColor Yellow
    }
    
    # Check required variables
    $requiredVars = @("DB_PASSWORD", "JWT_SECRET", "FRONTEND_API_URL", "CORS_FRONTEND_ORIGIN")
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=\s*$" -or $envContent -notmatch $var) {
            $issues += "❌ Missing or empty: $var in .env.production"
            Write-Host "   ❌ Missing: $var" -ForegroundColor Red
        } else {
            Write-Host "   ✓ Found: $var" -ForegroundColor Green
        }
    }
} else {
    $issues += "❌ .env.production file not found"
    Write-Host "   ❌ .env.production file not found" -ForegroundColor Red
    Write-Host "   💡 Copy .env.production.example to .env.production and fill in values" -ForegroundColor Cyan
}

Write-Host ""

# Check 2: Docker Compose production file
Write-Host "🐳 Checking Docker Compose configuration..." -ForegroundColor Yellow
if (Test-Path "docker-compose.prod.yml") {
    Write-Host "   ✓ docker-compose.prod.yml found" -ForegroundColor Green
    
    $composeContent = Get-Content "docker-compose.prod.yml" -Raw
    
    # Check for required services
    $requiredServices = @("postgres", "backend", "frontend", "nginx", "opennsfw", "moderator")
    foreach ($service in $requiredServices) {
        if ($composeContent -match "  $service`:") {
            Write-Host "   ✓ Service defined: $service" -ForegroundColor Green
        } else {
            $issues += "❌ Missing service in docker-compose.prod.yml: $service"
            Write-Host "   ❌ Missing service: $service" -ForegroundColor Red
        }
    }
    
    # Check for port exposures (should be empty for backend/frontend)
    if ($composeContent -match "backend:[\s\S]*?ports:\s*\[\]") {
        Write-Host "   ✓ Backend ports properly configured (not exposed)" -ForegroundColor Green
    } else {
        $warnings += "⚠️  Backend ports may be exposed directly"
        Write-Host "   ⚠️  Backend ports configuration check" -ForegroundColor Yellow
    }
    
    # Check nginx ports (should be 80 and 443)
    if ($composeContent -match 'nginx:[\s\S]*?ports:[\s\S]*?80:80[\s\S]*?443:443') {
        Write-Host "   ✓ Nginx ports properly configured (80, 443)" -ForegroundColor Green
    } else {
        $issues += "❌ Nginx ports not properly configured"
        Write-Host "   ❌ Nginx ports not properly configured" -ForegroundColor Red
    }
    
} else {
    $issues += "❌ docker-compose.prod.yml not found"
    Write-Host "   ❌ docker-compose.prod.yml not found" -ForegroundColor Red
}

Write-Host ""

# Check 3: SSL Configuration
Write-Host "🔒 Checking SSL configuration..." -ForegroundColor Yellow
if (Test-Path "CueFinderFE/cuefinderfe/nginx-ssl.conf") {
    Write-Host "   ✓ nginx-ssl.conf found" -ForegroundColor Green
    
    $nginxContent = Get-Content "CueFinderFE/cuefinderfe/nginx-ssl.conf" -Raw
    
    # Check for SSL certificate paths
    if ($nginxContent -match "ssl_certificate") {
        Write-Host "   ✓ SSL certificate configuration found" -ForegroundColor Green
    } else {
        $issues += "❌ SSL certificate not configured in nginx-ssl.conf"
        Write-Host "   ❌ SSL certificate not configured" -ForegroundColor Red
    }
    
    # Check for security headers
    $securityHeaders = @("Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options")
    foreach ($header in $securityHeaders) {
        if ($nginxContent -match $header) {
            Write-Host "   ✓ Security header: $header" -ForegroundColor Green
        } else {
            $warnings += "⚠️  Missing security header: $header"
            Write-Host "   ⚠️  Missing header: $header" -ForegroundColor Yellow
        }
    }
    
    # Check for API proxies
    if ($nginxContent -match "location.*\/api\/" -and $nginxContent -match "location.*\/moderator\/api\/") {
        Write-Host "   ✓ API proxies configured (main + moderator)" -ForegroundColor Green
    } else {
        $issues += "❌ API proxies not properly configured"
        Write-Host "   ❌ API proxies not properly configured" -ForegroundColor Red
    }
    
} else {
    $issues += "❌ nginx-ssl.conf not found"
    Write-Host "   ❌ nginx-ssl.conf not found" -ForegroundColor Red
}

Write-Host ""

# Check 4: Dockerfile existence
Write-Host "📦 Checking Dockerfiles..." -ForegroundColor Yellow
$dockerfiles = @(
    "CueFinderBE/Dockerfile",
    "CueFinderModerator/Dockerfile",
    "CueFinderFE/cuefinderfe/Dockerfile",
    "deployment/Dockerfile.nudenet"
)

foreach ($dockerfile in $dockerfiles) {
    if (Test-Path $dockerfile) {
        Write-Host "   ✓ Found: $dockerfile" -ForegroundColor Green
    } else {
        $issues += "❌ Missing: $dockerfile"
        Write-Host "   ❌ Missing: $dockerfile" -ForegroundColor Red
    }
}

Write-Host ""

# Check 5: Required directories
Write-Host "📁 Checking required directories..." -ForegroundColor Yellow
$requiredDirs = @("uploads", "ssl")
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "   ✓ Directory exists: $dir" -ForegroundColor Green
    } else {
        $warnings += "⚠️  Directory missing (will be created): $dir"
        Write-Host "   ⚠️  Directory missing: $dir (will be created on server)" -ForegroundColor Yellow
        
        if ($Fix) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "      ✓ Created: $dir" -ForegroundColor Green
        }
    }
}

Write-Host ""

# Check 6: Port conflicts (if running locally)
Write-Host "🔌 Checking for port conflicts..." -ForegroundColor Yellow
try {
    $portsToCheck = @(80, 443, 5432)
    foreach ($port in $portsToCheck) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $processId = $connection[0].OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            $warnings += "⚠️  Port $port is in use by: $($process.ProcessName)"
            Write-Host "   ⚠️  Port $port in use by: $($process.ProcessName)" -ForegroundColor Yellow
        } else {
            Write-Host "   ✓ Port $port available" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ⚠️  Cannot check port conflicts (may need admin rights)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Summary
Write-Host ""
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "══════════" -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All checks passed! Ready for production deployment." -ForegroundColor Green
    exit 0
} else {
    if ($issues.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ CRITICAL ISSUES ($($issues.Count)):" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   $issue" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    if ($issues.Count -gt 0) {
        Write-Host "🚫 Cannot deploy with critical issues. Fix them first!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "⚠️  Warnings present but can deploy. Review warnings first." -ForegroundColor Yellow
        exit 0
    }
}
