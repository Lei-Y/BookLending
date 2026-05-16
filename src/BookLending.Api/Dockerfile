# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only the csproj files first so the restore layer is cached
# unless the dependency graph (PackageReference / ProjectReference / TFM)
# actually changes. Source code edits will invalidate the later COPY
# layer but leave this expensive step intact.
COPY src/BookLending.Domain/BookLending.Domain.csproj             src/BookLending.Domain/
COPY src/BookLending.Service/BookLending.Service.csproj           src/BookLending.Service/
COPY src/BookLending.Infrastructure/BookLending.Infrastructure.csproj src/BookLending.Infrastructure/
COPY src/BookLending.Api/BookLending.Api.csproj                   src/BookLending.Api/

RUN dotnet restore src/BookLending.Api/BookLending.Api.csproj

# Copy the actual source for the API and its referenced libraries.
# Tests are intentionally excluded from the runtime image.
COPY src/BookLending.Domain/             src/BookLending.Domain/
COPY src/BookLending.Service/            src/BookLending.Service/
COPY src/BookLending.Infrastructure/     src/BookLending.Infrastructure/
COPY src/BookLending.Api/                src/BookLending.Api/

RUN dotnet publish src/BookLending.Api/BookLending.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Run as a non-root user. The aspnet image creates `app` (uid 1654) for us.
USER app

COPY --from=build /app .

# Kestrel listens on 8080 inside the container; map to a host port in compose.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BookLending.Api.dll"]
