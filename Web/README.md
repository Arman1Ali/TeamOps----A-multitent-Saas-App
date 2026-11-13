# TeamOps Web

Standalone, responsive React and TypeScript UI for the TeamOps team-management
app. Styling uses Tailwind CSS 4 utilities with shared theme tokens. The app
currently uses sample data only; it is not connected to the backend and changes
are not persisted after a page reload.

## Requirements

- Node.js 20.19+, 22.13+, or 24.10+
- npm

## Run locally

```sh
npm install
npm run dev
```

## Quality checks and production build

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Source layout

```text
src/
  components/
    layout/       Application shell and navigation
    projects/     Project creation dialog
    ui/           Reusable, accessible UI primitives
  data/           Local sample workspace data
  features/
    overview/     Dashboard overview and summary components
    projects/     Project list, filters, and project cards
    tasks/        Task list and task management
    team/         Team directory
  hooks/          Workspace state and actions
  types/          Shared domain types
```
