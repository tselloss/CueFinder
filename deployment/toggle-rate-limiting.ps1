# Temporarily Disable Rate Limiting for Security Testing
# Run this before security tests on production server

param(
    [switch]$Enable
)

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║      ⚡ Rate Limiting Toggle (Security Testing) ⚡        ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$programFile = "CueFinderBE/Program.cs"

if ($Enable) {
    Write-Host "✅ Re-enabling rate limiting..." -ForegroundColor Yellow
    
    $content = Get-Content $programFile -Raw
    $content = $content -replace '//\s*app\.UseRateLimiting', 'app.UseRateLimiting'
    Set-Content $programFile -Value $content
    
    Write-Host "   ✓ Rate limiting enabled" -ForegroundColor Green
    Write-Host "   ⚠️  Rebuild and restart the application for changes to take effect" -ForegroundColor Yellow
    
} else {
    Write-Host "⚠️  Disabling rate limiting for security testing..." -ForegroundColor Yellow
    Write-Host "   ⚠️  WARNING: This should ONLY be done during security testing!" -ForegroundColor Red
    Write-Host "   ⚠️  Re-enable immediately after testing!" -ForegroundColor Red
    Write-Host ""
    
    $content = Get-Content $programFile -Raw
    $content = $content -replace '^(\s*app\.UseRateLimiting)', '// $1' -replace '([^/])app\.UseRateLimiting', '$1// app.UseRateLimiting'
    Set-Content $programFile -Value $content
    
    Write-Host "   ✓ Rate limiting disabled" -ForegroundColor Green
    Write-Host "   ⚠️  Rebuild and restart the application" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 To re-enable after testing:" -ForegroundColor Cyan
    Write-Host "   .\deployment\toggle-rate-limiting.ps1 -Enable" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Rebuild: docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend" -ForegroundColor Gray
Write-Host "   2. Restart: docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend" -ForegroundColor Gray
if (-not $Enable) {
    Write-Host "   3. Run tests: cd tests/SecurityTests && node api-security-tests.js" -ForegroundColor Gray
    Write-Host "   4. Re-enable: .\deployment\toggle-rate-limiting.ps1 -Enable" -ForegroundColor Gray
}
