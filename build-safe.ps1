# Safe Build Script for CueFinder
# This script builds the solution with memory-friendly settings

Write-Host "Starting safe build process..." -ForegroundColor Green

# Clean previous build artifacts
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
dotnet clean CueFinderBE/CueFinderBE.sln --configuration Release

# Build projects individually to reduce memory pressure
Write-Host "Building projects individually..." -ForegroundColor Yellow

$projects = @(
    "SolutionLibraries/CueFinder.Database/CueFinder.Database.csproj",
    "SolutionLibraries/CueFinder.Auth/CueFinder.Auth.csproj",
    "SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/CueFinder.Extensions.csproj",
    "SolutionLibraries/CueFinder.Cues/CueFinder.Cues/CueFinder.Cues.csproj",
    "SolutionLibraries/CueFinder.CueCases/CueFinder.CueCases/CueFinder.CueCases.csproj",
    "CueFinderBE/CueFinderBE.csproj"
)

foreach ($project in $projects) {
    Write-Host "Building $project..." -ForegroundColor Cyan
    dotnet build $project --configuration Release --no-incremental
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed for $project" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Build completed successfully!" -ForegroundColor Green
