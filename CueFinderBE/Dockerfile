FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["CueFinderBE/CueFinderBE.csproj", "CueFinderBE/"]
COPY ["SolutionLibraries/CueFinder.Auth/CueFinder.Auth.csproj", "SolutionLibraries/CueFinder.Auth/"]
COPY ["SolutionLibraries/CueFinder.Database/CueFinder.Database.csproj", "SolutionLibraries/CueFinder.Database/"]
COPY ["SolutionLibraries/CueFinder.Cues/CueFinder.Cues/CueFinder.Cues.csproj", "SolutionLibraries/CueFinder.Cues/CueFinder.Cues/"]
COPY ["SolutionLibraries/CueFinder.CueCases/CueFinder.CueCases/CueFinder.CueCases.csproj", "SolutionLibraries/CueFinder.CueCases/CueFinder.CueCases/"]
COPY ["SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/CueFinder.Extensions.csproj", "SolutionLibraries/CueFinder.Extensions/CueFinder.Extensions/"]
COPY ["SolutionLibraries/CueFinder.Messages/CueFinder.Messages.csproj", "SolutionLibraries/CueFinder.Messages/"]
COPY ["SolutionLibraries/CueFinder.Forum/CueFinder.Forum.csproj", "SolutionLibraries/CueFinder.Forum/"]
COPY ["SolutionLibraries/CueFinder.Accessories/CueFinder.Accessories/CueFinder.Accessories.csproj", "SolutionLibraries/CueFinder.Accessories/CueFinder.Accessories/"]
COPY ["SolutionLibraries/CueFinder.BilliardTables/CueFinder.BilliardTables/CueFinder.BilliardTables.csproj", "SolutionLibraries/CueFinder.BilliardTables/CueFinder.BilliardTables/"]
COPY ["SolutionLibraries/CueFinder.Raffles/CueFinder.Raffles.csproj", "SolutionLibraries/CueFinder.Raffles/"]
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
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "CueFinderBE.dll"]
