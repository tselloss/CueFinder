# Quick Start: Add Caching to CueFinder Backend
# This script helps you integrate the caching mechanism

Write-Host "=== CueFinder Caching Integration ===" -ForegroundColor Cyan
Write-Host ""

$projectPath = "c:\Users\karac\source\repos\CueFinder\CueFinderBE\CueFinderBE.csproj"
$programPath = "c:\Users\karac\source\repos\CueFinder\CueFinderBE\Program.cs"
$appsettingsPath = "c:\Users\karac\source\repos\CueFinder\CueFinderBE\appsettings.json"

# Step 1: Add project reference
Write-Host "Step 1: Adding project reference to CueFinder.Extensions..." -ForegroundColor Yellow

$projectContent = Get-Content $projectPath -Raw

if ($projectContent -notlike "*CueFinder.Extensions*") {
    Write-Host "  Adding reference..." -ForegroundColor Green
    
    # This is a manual step - show instructions
    Write-Host ""
    Write-Host "  ACTION REQUIRED: Add this to your CueFinderBE.csproj:" -ForegroundColor Magenta
    Write-Host ""
    Write-Host '  <ItemGroup>' -ForegroundColor White
    Write-Host '    <ProjectReference Include="..\SolutionLibraries\CueFinder.Extensions\CueFinder.Extensions\CueFinder.Extensions.csproj" />' -ForegroundColor White
    Write-Host '  </ItemGroup>' -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ✓ Reference already exists" -ForegroundColor Green
}

# Step 2: Check Program.cs
Write-Host "Step 2: Checking Program.cs..." -ForegroundColor Yellow

$programContent = Get-Content $programPath -Raw

if ($programContent -notlike "*AddCueFinderCaching*") {
    Write-Host ""
    Write-Host "  ACTION REQUIRED: Add this to your Program.cs:" -ForegroundColor Magenta
    Write-Host ""
    Write-Host '  using CueFinder.Extensions.Caching;' -ForegroundColor White
    Write-Host ""
    Write-Host '  // Add caching services (after other services)' -ForegroundColor Gray
    Write-Host '  builder.Services.AddCueFinderCaching(builder.Configuration);' -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ✓ Caching already configured in Program.cs" -ForegroundColor Green
}

# Step 3: Check appsettings.json
Write-Host "Step 3: Checking appsettings.json..." -ForegroundColor Yellow

$appsettingsContent = Get-Content $appsettingsPath -Raw

if ($appsettingsContent -notlike "*Caching*") {
    Write-Host ""
    Write-Host "  ACTION REQUIRED: Add this to your appsettings.json:" -ForegroundColor Magenta
    Write-Host ""
    Write-Host '  "Caching": {' -ForegroundColor White
    Write-Host '    "DefaultAbsoluteExpirationMinutes": 60,' -ForegroundColor White
    Write-Host '    "DefaultSlidingExpirationMinutes": 20,' -ForegroundColor White
    Write-Host '    "MaxCacheSize": 1000,' -ForegroundColor White
    Write-Host '    "EnableCaching": true,' -ForegroundColor White
    Write-Host '    "EnableStatistics": true' -ForegroundColor White
    Write-Host '  }' -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ✓ Caching configuration already exists" -ForegroundColor Green
}

# Step 4: Build check
Write-Host "Step 4: Testing build..." -ForegroundColor Yellow
Write-Host "  Building solution..." -ForegroundColor Gray

try {
    $buildOutput = dotnet build "c:\Users\karac\source\repos\CueFinder\CueFinderBE\CueFinderBE.sln" --verbosity quiet 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Build failed. Please fix errors first." -ForegroundColor Red
        Write-Host $buildOutput
    }
} catch {
    Write-Host "  ⚠ Could not test build automatically" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review the integration guide:" -ForegroundColor White
Write-Host "   docs/CACHING_INTEGRATION_EXAMPLE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Inject ICacheService in your controllers:" -ForegroundColor White
Write-Host '   private readonly ICacheService _cacheService;' -ForegroundColor Gray
Write-Host ""
Write-Host "3. Use caching in your methods:" -ForegroundColor White
Write-Host '   var user = await _cacheService.GetOrCreateAsync(' -ForegroundColor Gray
Write-Host '       CacheKeys.User(id),' -ForegroundColor Gray
Write-Host '       async () => await _context.Users.FindAsync(id)' -ForegroundColor Gray
Write-Host '   );' -ForegroundColor Gray
Write-Host ""
Write-Host "4. Invalidate cache on updates:" -ForegroundColor White
Write-Host '   await _cacheService.RemoveAsync(CacheKeys.User(id));' -ForegroundColor Gray
Write-Host ""
Write-Host "Happy caching! 🚀" -ForegroundColor Green
