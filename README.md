# BookLending — 1Breadcrumb Library Prototype

[![CI](https://github.com/Lei-Y/BookLending/actions/workflows/ci.yml/badge.svg)](https://github.com/Lei-Y/BookLending/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Lei-Y/BookLending/graph/badge.svg?token=MZWDHRL8R6)](https://codecov.io/gh/Lei-Y/BookLending)

Crumb-to-Crumb book lending library prototype. Discovery-focused: who owns
which books and whether they are available to borrow.

## Project Layout

```
BookLending.slnx                     Solution file
src/
  BookLending.Domain/                Entities, value types, repository contract
  BookLending.Service/               Business logic (IBookService / BookService)
  BookLending.Infrastructure/        Concrete persistence (in-memory) + seed data
  BookLending.Api/                   ASP.NET Core Web API host, controllers, DI
tests/
  BookLending.Service.Tests/         xUnit unit tests for the service layer
  BookLending.IntegrationTests/      xUnit integration tests over the HTTP pipeline
web/                                 Vite + React + TypeScript frontend
```

**Dependency direction:** `Api → Service → Domain` and `Infrastructure → Domain`.
Domain has zero outward references; Service knows nothing about HTTP or storage.

## Quick start with Docker

The fastest way to try the app. No local .NET or Node install required —
just Docker.

```
docker compose up --build
```

Then open:

- Web UI: <http://localhost:5173>
- API: <http://localhost:5110>
- Scalar API explorer: <http://localhost:5110/scalar/v1>

Stop everything with `Ctrl+C`, then `docker compose down` to remove the
containers.

The compose file builds two images:

- `booklending-api` — multi-stage `dotnet/sdk` → `dotnet/aspnet` runtime,
  runs as a non-root user, listens on port 8080 inside the container
  (mapped to host `5110`).
- `booklending-web` — multi-stage `node` build → `nginx:alpine` serving the
  Vite production bundle on port 80 (mapped to host `5173`).

Dockerfiles live next to the projects they build
(`src/BookLending.Api/Dockerfile`, `web/Dockerfile`) and both use a
csproj-first / `package.json`-first layer ordering so dependency restore is
cached across source-only changes.

## Running locally (without Docker)

### Backend
```
dotnet run --project src/BookLending.Api
```
API listens on `http://localhost:5110`. CORS is open to `http://localhost:5173`.
Seed data is loaded on first start (in-memory store, resets per process).

### Frontend
```
cd web
npm install
npm run dev
```
Vite dev server at `http://localhost:5173`. Override the API target with
`VITE_API_BASE_URL` if needed.

### Tests
```
dotnet test
```

## API

| Verb   | Route                              | Purpose                          |
|--------|-------------------------------------|----------------------------------|
| GET    | `/api/books?search&availability&page&pageSize` | List + filter + paginate |
| GET    | `/api/books/{id}`                   | Fetch one                        |
| POST   | `/api/books`                        | Create `{ title, owner }`        |
| PATCH  | `/api/books/{id}/toggle`            | Toggle availability (borrow/return) |
| DELETE | `/api/books/{id}`                   | Remove                           |

### Interactive API explorer (Scalar)

The Development environment exposes an interactive OpenAPI explorer powered by
[Scalar](https://github.com/scalar/scalar):

- Scalar UI: <http://localhost:5110/scalar/v1>
- Raw OpenAPI document: <http://localhost:5110/openapi/v1.json>

The OpenAPI document itself is produced by ASP.NET Core's built-in
`AddOpenApi()` (no Swashbuckle dependency). Scalar reads that document and
renders the UI; the two layers are independent and either can be swapped
without touching the controllers.

Both endpoints are only mapped when `ASPNETCORE_ENVIRONMENT=Development` to
avoid exposing the schema in production.

## Design Notes

- **Auth is intentionally out of scope** for this prototype. Owner is a free-form
  string. In production, Owner would resolve from the authenticated Crumb's
  identity (e.g. SSO/JWT) and `Borrow` would record the borrower.
- The shipped 1Breadcrumb sandbox API was not used: it lacked auth and a stable
  spec; self-hosting the API avoided risk in the 1-hour window and kept the
  surface area honest for review.
- In-memory storage was chosen for demo simplicity; swapping
  `InMemoryBookRepository` for an EF Core / Dapper implementation is a single
  DI registration change in `Program.cs`.
- Pagination defaults to 5 items per page on the client to match the "fit on
  screen" hint from the sketch.

## Testing Strategy

Tests are split into two projects so the fast feedback loop is not slowed
down by host startup.

### Unit tests — `BookLending.Service.Tests`

Exercise `BookService` in isolation against a fresh in-memory repository:

- Input validation on `Create` (blank title / owner).
- `Toggle` happy path and missing-id path.
- `Delete` happy path and missing-id path.
- `Query` filtering by search (case-insensitive), filtering by availability,
  and pagination + ordering.
- A defensive branch in `PagedResult.TotalPages` that the service itself
  never reaches but that is still part of the Domain contract.
- `BookSeeder` populates the repository with valid books.

### Integration tests — `BookLending.IntegrationTests`

Built on `Microsoft.AspNetCore.Mvc.Testing`. `IsolatedFactory` spins up the
real ASP.NET host in-process, switches it into the `Testing` environment
(so `Program.cs` skips the seed), and replaces the singleton repository
with an empty one. The factory exposes a `ResetState()` hook that the test
class constructor calls before every `[Fact]`, so each test runs against a
clean repository while the host is built only once per class.

These tests cover the wiring that unit tests cannot:

- Status codes (`201 Created` with `Location` header, `204 No Content`,
  `404 Not Found`, `400 Bad Request`).
- JSON serialisation uses camelCase property names — the contract the
  React client relies on.
- Query-string binding for `search`, `availability`, `page`, `pageSize`.
- Round-trip behaviour: create then fetch by id, toggle then re-read.

### Frontend

The React layer has no automated tests yet. Highest-value additions would
be a Vitest + React Testing Library suite for `LibraryPage` covering filter
resets, pagination boundaries, and the delete-last-on-page bounce.
