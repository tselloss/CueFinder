#!/usr/bin/env pwsh
# Fix Production Database Schema - Interactive Version

$ServerIP = "116.203.137.201"
$ServerUser = "cuefinder"
$SSHKey = "$env:USERPROFILE\.ssh\id_rsa"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🎱 CueFinder Production Schema Fix 🎱                 ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 This script will:" -ForegroundColor Yellow
Write-Host "   1. Check current schema on production" -ForegroundColor Gray
Write-Host "   2. Add CreatedByUsername column if missing" -ForegroundColor Gray
Write-Host "   3. Verify the changes" -ForegroundColor Gray
Write-Host ""

# Step 1: Check current schema
Write-Host "🔍 Step 1: Checking current production schema..." -ForegroundColor Yellow
Write-Host "   Connecting to $ServerIP..." -ForegroundColor Gray
Write-Host ""

$checkSchema = @"
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder -c "
SELECT table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('Posts','Discussions') 
AND column_name='CreatedByUsername';
"
"@

Write-Host "   Running: Check schema..." -ForegroundColor Gray
ssh -i $SSHKey ${ServerUser}@${ServerIP} $checkSchema

Write-Host ""
Write-Host "📝 Step 2: Applying schema updates..." -ForegroundColor Yellow

$applySchema = @"
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder <<'EOSQL'
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';
ALTER TABLE "Discussions" ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';
EOSQL
"@

Write-Host "   Adding CreatedByUsername columns..." -ForegroundColor Gray
ssh -i $SSHKey ${ServerUser}@${ServerIP} $applySchema

Write-Host ""
Write-Host "✅ Step 3: Verifying changes..." -ForegroundColor Yellow
ssh -i $SSHKey ${ServerUser}@${ServerIP} $checkSchema

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ Schema Update Complete! ✅               ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Production database schema is now synchronized with local." -ForegroundColor Cyan
Write-Host ""
