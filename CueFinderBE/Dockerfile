FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["CueFinderBE/CueFinderBE.csproj", "CueFinderBE/"]
COPY ["CueFinder.Auth/CueFinder.Auth.csproj", "CueFinder.Auth/"]
COPY ["CueFinder.Database/CueFinder.Database.csproj", "CueFinder.Database/"]

# Restore dependencies
RUN dotnet restore "CueFinderBE/CueFinderBE.csproj"

# Copy all source files
COPY . .

# Build the application
WORKDIR "/src/CueFinderBE"
RUN dotnet build "CueFinderBE.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CueFinderBE.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Development

ENTRYPOINT ["dotnet", "CueFinderBE.dll"]
