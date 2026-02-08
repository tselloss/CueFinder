FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5202

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["CueFinderBookingBE/CueFinderBookingBE.csproj", "CueFinderBookingBE/"]
COPY ["SolutionLibraries/CueFinder.Auth/CueFinder.Auth.csproj", "SolutionLibraries/CueFinder.Auth/"]

RUN dotnet restore "CueFinderBookingBE/CueFinderBookingBE.csproj"

COPY . .

WORKDIR "/src/CueFinderBookingBE"
RUN dotnet build "CueFinderBookingBE.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CueFinderBookingBE.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://+:5202
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "CueFinderBookingBE.dll"]
