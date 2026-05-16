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
  BookLending.Service.Tests/         xUnit tests for the service layer
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

`BookLending.Service.Tests` covers the parts of `BookService` worth pinning
down: input validation on create, search casing, availability filter,
toggle behaviour, and pagination + ordering. The controller is a thin
pass-through and the repository is trivial, so neither was unit-tested for
this prototype. With more time I would add a `WebApplicationFactory`-based
integration test that exercises the HTTP surface and CORS configuration end
to end.

The React layer has no automated tests in this iteration. Highest-value
additions would be a React Testing Library suite for `LibraryPage`
covering filter resets, pagination boundaries, and the delete-last-on-page
bounce.
