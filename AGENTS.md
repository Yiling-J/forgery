# Developer Guide

## Backend Architecture

The backend is built with:

- **Runtime**: Bun
- **Framework**: Hono
- **ORM**: Prisma (with SQLite)
- **Database**: SQLite (local file)
- **AI**: Google Generative AI (Gemini)

### Layered Architecture

We follow a strict layered architecture:

1.  **API Layer (`src/api`)**: Handles HTTP requests, validation, and calls Service layer. **Do not access DB directly.**
2.  **Service Layer (`src/service`)**: Contains business logic and interacts with the Database via Prisma.
3.  **Data Layer (`src/db.ts`)**: Exports the Prisma Client instance.

## Frontend Architecture

The frontend is built with:

- **Runtime**: Bun (Bundler & Runner)
- **Framework**: React
- **Styling**: Tailwind CSS + Shadcn UI (Components)
- **State**: React Hooks (useState, useEffect)

### Project Structure

- `ui/`: Root of the frontend project.
- `ui/index.html`: Entry point for the frontend.
- `ui/App.tsx`: Main application component.
- `ui/components/`: Reusable UI components.
- `ui/index.css`: Global styles (Tailwind imports).

### Development

- **Run Backend**: `bun --hot src/index.ts` (Runs on port 3000)
- **Run Frontend**: `bun --hot ui/index.html` (Runs on port 3001, make sure port 3000 is running for API)

### Build

- **Build Frontend**: `bun build ui/index.html --outdir=ui/dist`

## Testing

We use `bun:test` for testing.

### Service Tests

- Located in `src/service/*.test.ts`.
- Mock `prisma` client using `mock.module('../db', ...)`.
- **Important**: Due to `bun test` module caching in parallel execution, service tests must import the service under test dynamically with a cache-busting query parameter to ensure a fresh module instance (and thus fresh mocks).
  ```typescript
  // @ts-ignore
  const { MyService } = await import(`./myService?v=${Date.now()}`)
  ```

### API Tests

- Located in `src/api/*.test.ts`.
- Mock the Service layer using `mock.module('../service/myService', ...)`.
- Verify that the API calls the Service methods correctly.

## Submission Rules

- **Strict Requirement**: You must ensure `lint`, `format`, `typecheck`, and `test` all pass before submitting any changes.

## Prisma Configuration

- Schema: `prisma/schema.prisma`
- Generated Client: `src/generated/prisma`
- Config: `prisma.config.ts` (Required for Prisma 7+)
- Adapter: We use `@prisma/adapter-libsql` for SQLite compatibility with Bun.

### Commands

- Generate Client: `bun --bun run prisma generate`
- Push Schema to DB: `bun --bun run prisma db push`

## Environment Variables

- `.env`: Development environment variables (`DATABASE_URL="file:./dev.db"`, `API_KEY="..."`).
- `.env.test`: Test environment variables (`DATABASE_URL="file:./test.db"`).

## Known Issues

- `bun test` module mocking can be sticky across test files running in the same process/worker. Use the dynamic import workaround in Service tests.
