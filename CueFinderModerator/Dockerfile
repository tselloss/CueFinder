# Multi-stage build for CueFinderModerator
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /src

# Copy solution files
COPY ["CueFinderModerator/CueFinderModerator.csproj", "CueFinderModerator/"]
COPY ["SolutionLibraries/CueFinder.Database/CueFinder.Database.csproj", "SolutionLibraries/CueFinder.Database/"]
COPY ["SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/CueFinder.Extensions.csproj", "SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/"]
COPY ["SolutionLibraries/CueFinder.Auth/CueFinder.Auth.csproj", "SolutionLibraries/CueFinder.Auth/"]

# Restore dependencies
RUN dotnet restore "CueFinderModerator/CueFinderModerator.csproj"

# Copy all source code
COPY . .

# Build the project
RUN dotnet build "CueFinderModerator/CueFinderModerator.csproj" -c Release -o /app/build

# Publish the project
FROM builder AS publish
RUN dotnet publish "CueFinderModerator/CueFinderModerator.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Expose port
EXPOSE 5001

# Run the application
ENTRYPOINT ["dotnet", "CueFinderModerator.dll"]
