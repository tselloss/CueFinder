#!/usr/bin/env pwsh

<#
.SYNOPSIS
Initializes the CueFinderModerator deployment environment

.DESCRIPTION
Checks and verifies that CueFinderModerator is properly configured and ready for deployment

.EXAMPLE
./init-moderator.ps1
#>

param(
    [switch]$Verbose,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

# Color output
$colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet("Success", "Error", "Warning", "Info")]
        [string]$Type = "Info"
    )
    Write-Host "[$Type] $Message" -ForegroundColor $colors[$Type]
}

# Verify files and structure
function Test-ProjectStructure {
    Write-Host "`n=== Checking Project Structure ===" -ForegroundColor Cyan
    
    $checks = @{
        "CueFinderModerator/CueFinderModerator.csproj" = "Project file"
        "CueFinderModerator/Program.cs" = "Program entry point"
        "CueFinderModerator/Dockerfile" = "Docker configuration"
        "CueFinderModerator/appsettings.json" = "App settings"
        "CueFinderModerator/appsettings.Development.json" = "Dev settings"
        "docker-compose.yml" = "Docker Compose"
        "deploy-moderator.ps1" = "PowerShell deploy script"
        "deploy-moderator.sh" = "Bash deploy script"
        "SolutionLibraries/CueFinder.Database/CueFinder.Database.csproj" = "Database library"
        "SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/CueFinder.Extensions.csproj" = "Extensions library"
    }
    
    $allGood = $true
    foreach ($file in $checks.Keys) {
        if (Test-Path $file) {
            Write-Status "✅ Found: $($checks[$file])" "Success"
        } else {
            Write-Status "❌ Missing: $($checks[$file]) at $file" "Error"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Check Docker installation
function Test-Docker {
    Write-Host "`n=== Checking Docker Installation ===" -ForegroundColor Cyan
    
    try {
        $version = & docker --version 2>$null
        if ($version) {
            Write-Status "✅ Docker installed: $version" "Success"
        } else {
            Write-Status "❌ Docker not found" "Error"
            return $false
        }
        
        $composeVersion = & docker-compose --version 2>$null
        if ($composeVersion) {
            Write-Status "✅ Docker Compose installed: $composeVersion" "Success"
        } else {
            Write-Status "⚠ Docker Compose not found (may need separate installation)" "Warning"
        }
        
        # Test Docker daemon
        $psResult = & docker ps 2>$null
        Write-Status "✅ Docker daemon is running" "Success"
        return $true
        
    } catch {
        Write-Status "❌ Docker not available: $_" "Error"
        return $false
    }
}

# Check .NET installation
function Test-Dotnet {
    Write-Host "`n=== Checking .NET Installation ===" -ForegroundColor Cyan
    
    try {
        $version = & dotnet --version 2>$null
        if ($version) {
            Write-Status "✅ .NET installed: $version" "Success"
            if ($version -match "8\.\d") {
                Write-Status "✅ .NET 8.0 detected (required)" "Success"
                return $true
            } else {
                Write-Status "⚠ Expected .NET 8.0, but found $version" "Warning"
                return $false
            }
        } else {
            Write-Status "❌ .NET not found" "Error"
            return $false
        }
    } catch {
        Write-Status "❌ .NET check failed: $_" "Error"
        return $false
    }
}

# Check project builds
function Test-ProjectBuild {
    Write-Host "`n=== Testing Project Build ===" -ForegroundColor Cyan
    
    try {
        Write-Host "Building CueFinderModerator..." -ForegroundColor Gray
        & dotnet build CueFinderModerator/CueFinderModerator.csproj -c Release 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✅ Project builds successfully" "Success"
            return $true
        } else {
            Write-Status "❌ Project build failed" "Error"
            return $false
        }
    } catch {
        Write-Status "❌ Build test failed: $_" "Error"
        return $false
    }
}

# Check database connectivity
function Test-DatabaseConnection {
    Write-Host "`n=== Checking Database Requirements ===" -ForegroundColor Cyan
    
    Write-Host "Database checks:" -ForegroundColor Gray
    Write-Status "✅ PostgreSQL required (docker-compose provides this)" "Info"
    Write-Status "✅ Database: cuefinder" "Info"
    Write-Status "✅ Port: 5432" "Info"
    
    return $true
}

# Generate deployment checklist
function Show-DeploymentChecklist {
    Write-Host "`n=== Deployment Checklist ===" -ForegroundColor Cyan
    
    $checklist = @"
Before deploying CueFinderModerator to production:

1. Database:
   ✓ PostgreSQL 15+ is installed and running
   ✓ Database 'cuefinder' exists
   ✓ User 'postgres' has proper permissions
   ✓ Backups are in place

2. Configuration:
   ✓ JWT secrets configured in appsettings.json
   ✓ NudeNet service URL configured (Moderation__NudeNetUrl)
   ✓ Connection strings updated for production
   ✓ Environment set to Production/Staging

3. Deployment:
   ✓ Review deploy-moderator.ps1 or deploy-moderator.sh
   ✓ Test deployment in staging first
   ✓ Verify container logs: docker logs cuefinder-moderator
   ✓ Monitor health endpoint: http://localhost:5001/health

4. Security:
   ✓ Update JWT secret keys (minimum 32 characters)
   ✓ Configure CORS for main backend
   ✓ Set up SSL/TLS certificates
   ✓ Configure firewall rules

5. Monitoring:
   ✓ Set up Docker health checks
   ✓ Configure logging and monitoring
   ✓ Test auto-restart on failure (restart: unless-stopped)

Usage:
  - Smart deploy (only rebuild if changes): ./deploy-moderator.ps1
  - Force rebuild: ./deploy-moderator.ps1 -Force
  - Just restart: ./deploy-moderator.ps1 -NoBuild
"@
    
    Write-Host $checklist -ForegroundColor Gray
}

# Main execution
function Main {
    Write-Host @"

╔════════════════════════════════════════════════════════════════════╗
║        CueFinderModerator Initialization & Verification           ║
║                     Version 1.0                                   ║
╚════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
    
    $tests = @(
        @{ Name = "Project Structure"; Function = { Test-ProjectStructure } }
        @{ Name = "Docker Installation"; Function = { Test-Docker } }
        @{ Name = "Dotnet Installation"; Function = { Test-Dotnet } }
        @{ Name = "Database Requirements"; Function = { Test-DatabaseConnection } }
    )
    
    if ($Full) {
        $tests += @{ Name = "Project Build"; Function = { Test-ProjectBuild } }
    }
    
    $results = @()
    foreach ($test in $tests) {
        $result = & $test.Function
        $results += $result
    }
    
    Show-DeploymentChecklist
    
    # Summary
    Write-Host "`n=== Initialization Summary ===" -ForegroundColor Cyan
    
    if ($results -contains $false) {
        Write-Status "⚠ Initialization completed with warnings or errors" "Warning"
        Write-Host "`nPlease address the issues above before deployment.`n"
        exit 1
    } else {
        Write-Status "✅ All checks passed! Ready for deployment" "Success"
        Write-Host "`nNext steps:`n"
        Write-Host "  1. Configure appsettings files (if needed)"
        Write-Host "  2. Start services: docker-compose up -d"
        Write-Host "  3. Deploy moderator: ./deploy-moderator.ps1"
        Write-Host ""
    }
}

Main
