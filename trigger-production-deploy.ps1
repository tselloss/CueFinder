#!/usr/bin/env pwsh
# Trigger Production Deployment Manually
# This script triggers all GitHub Actions workflows for production deployment

param(
    [Parameter()]
    [ValidateSet('full', 'smart', 'backend-only', 'frontend-only', 'infra-only')]
    [string]$Mode = 'full',
    
    [Parameter()]
    [switch]$SkipMigrations
)

Write-Host "🚀 Triggering Production Deployment" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Yellow
Write-Host "Skip Migrations: $SkipMigrations" -ForegroundColor Yellow
Write-Host ""

# Check if gh CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or manually trigger at:" -ForegroundColor Cyan
    Write-Host "https://github.com/tselloss/CueFinder/actions/workflows/deploy-production.yml" -ForegroundColor Blue
    exit 1
}

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub CLI" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green
Write-Host ""

# Trigger the orchestrator workflow
Write-Host "📋 Triggering deployment orchestrator..." -ForegroundColor Cyan

try {
    if ($Mode -eq 'full') {
        # Full deployment - trigger orchestrator
        gh workflow run deploy-production.yml `
            --ref release `
            -f deployment-mode=$Mode `
            -f skip-migrations=$($SkipMigrations.ToString().ToLower())
        
        Write-Host "✅ Orchestrator workflow triggered!" -ForegroundColor Green
    }
    elseif ($Mode -eq 'infra-only') {
        # Infrastructure only
        gh workflow run deploy-infra.yml `
            --ref release `
            -f skip-migrations=$($SkipMigrations.ToString().ToLower())
        
        Write-Host "✅ Infrastructure workflow triggered!" -ForegroundColor Green
    }
    elseif ($Mode -eq 'backend-only') {
        # Backend only
        gh workflow run deploy-backend.yml --ref release
        
        Write-Host "✅ Backend workflow triggered!" -ForegroundColor Green
    }
    elseif ($Mode -eq 'frontend-only') {
        # Frontend only
        gh workflow run deploy-frontend.yml --ref release
        
        Write-Host "✅ Frontend workflow triggered!" -ForegroundColor Green
    }
    else {
        # Smart mode - use orchestrator
        gh workflow run deploy-production.yml `
            --ref release `
            -f deployment-mode=$Mode `
            -f skip-migrations=$($SkipMigrations.ToString().ToLower())
        
        Write-Host "✅ Orchestrator workflow triggered (smart mode)!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📊 View workflow runs:" -ForegroundColor Cyan
    Write-Host "https://github.com/tselloss/CueFinder/actions" -ForegroundColor Blue
    Write-Host ""
    Write-Host "⏳ Waiting 5 seconds before showing status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "📋 Recent workflow runs:" -ForegroundColor Cyan
    gh run list --limit 5 --branch release
    
} catch {
    Write-Host "❌ Failed to trigger workflow: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Deployment triggered successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Monitor progress with:" -ForegroundColor Cyan
Write-Host "   gh run watch" -ForegroundColor White
Write-Host "   or visit: https://github.com/tselloss/CueFinder/actions" -ForegroundColor White
