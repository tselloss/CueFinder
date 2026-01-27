# Multi-stage build for CueFinderModerator
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /src

# Copy solution files - paths relative to repo root
COPY ["SolutionLibraries/CueFinderModerator/CueFinderModerator.csproj", "SolutionLibraries/CueFinderModerator/"]
COPY ["SolutionLibraries/CueFinder.Database/CueFinder.Database.csproj", "SolutionLibraries/CueFinder.Database/"]
COPY ["SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/CueFinder.Extensions.csproj", "SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/"]
COPY ["SolutionLibraries/CueFinder.Auth/CueFinder.Auth.csproj", "SolutionLibraries/CueFinder.Auth/"]

# Restore dependencies
RUN dotnet restore "SolutionLibraries/CueFinderModerator/CueFinderModerator.csproj"

# Copy all required source code
COPY SolutionLibraries/CueFinderModerator ./SolutionLibraries/CueFinderModerator
COPY SolutionLibraries/CueFinder.Database ./SolutionLibraries/CueFinder.Database
COPY SolutionLibraries/CueFinder.Extensions ./SolutionLibraries/CueFinder.Extensions
COPY SolutionLibraries/CueFinder.Auth ./SolutionLibraries/CueFinder.Auth

# Build the project
RUN dotnet build "SolutionLibraries/CueFinderModerator/CueFinderModerator.csproj" -c Release -o /app/build

# Publish the project
FROM builder AS publish
RUN dotnet publish "SolutionLibraries/CueFinderModerator/CueFinderModerator.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Set environment variables for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:5001
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 5001

# Run the application
ENTRYPOINT ["dotnet", "CueFinderModerator.dll"]
