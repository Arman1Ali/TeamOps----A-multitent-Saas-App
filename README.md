# TeamOps Web

The TeamOps web client is a responsive Next.js App Router application built
with React, TypeScript, and Tailwind CSS 4. It connects to the FastAPI backend
for authentication and workspace data; projects, tasks, and team changes are
sent to the API rather than stored only in browser sample data.

## Requirements

- Node.js 20.9 or newer
- npm
- The TeamOps API and its PostgreSQL database running locally or at reachable
  addresses

## Run locally

Start the API and database first. From `Backend/teamops`, copy
`.env.example` to `.env` if needed and set the PostgreSQL credentials and
`DATABASE_URL` to match. If PostgreSQL is not already running on the configured
host port (5433 by default), start the Compose database:

```powershell
docker compose --profile database up -d db
```

Start the API container separately:

```powershell
docker compose up --build -d api
```

The API connects to PostgreSQL through the configured host port, applies
Alembic migrations, and listens at `http://127.0.0.1:8000`. Use
`docker compose logs -f api` to inspect startup or migration errors. Stop the
API with `docker compose stop api`; database data is retained.

In a separate terminal, from `Web`:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js forwards
`/api/v1/*` requests to the backend, so the browser uses the same origin and
does not need a separate CORS configuration.

To use an API on a different host or port, set `BACKEND_ORIGIN` before starting
Next.js, or add it to `Web/.env.local`:

```text
BACKEND_ORIGIN=http://127.0.0.1:8000
```

If you set `NEXT_PUBLIC_API_BASE_URL` to call the API directly instead of using
the rewrite, configure the backend's `CORS_ORIGINS` to allow the web app's
origin as well.

## Checks and production

Run these commands from `Web`:

```powershell
npm run lint
npm run typecheck
npm run build
npm run start
```

`npm run start` serves the production build after `npm run build`.

## Source layout

```text
src/
  app/                 Next.js routes, root providers, and dashboard layout
  components/
    layout/            Sidebar, header, navigation, and workspace shell
    ui/                Shared dialogs, buttons, status, and feedback
  features/
    overview/          Workspace overview
    projects/          Project list and project forms
    tasks/              Task list and task forms
    team/               Team directory and invitation form
  hooks/                Auth, workspace data, and UI state
  lib/
    api/                Typed backend clients and API response mapping
    auth/               Browser token/session handling
  types/                API and UI domain types
```
