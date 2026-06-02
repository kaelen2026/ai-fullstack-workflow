# ai-fullstack-workflow

A type-safe full-stack monorepo powered by [Turborepo](https://turbo.build) and pnpm workspaces.

## Stack

| App / Package              | Tech                                                                    |
| -------------------------- | ----------------------------------------------------------------------- |
| `apps/web`                 | Next.js 16 (App Router) · Tailwind CSS v4 · shadcn/ui · React Query      |
| `apps/api`                 | Hono · tRPC v11 · Zod · Drizzle ORM (Postgres) · Docker                  |
| `packages/typescript-config` | Shared `tsconfig` presets                                             |

Tooling: **Biome** (lint + format), **husky** + **lint-staged** (git hooks),
**commitlint** (conventional commits), **Changesets** (versioning + changelog),
**GitHub Actions** (CI).

End-to-end type safety: the web app imports the API's router type via
`import type { AppRouter } from '@repo/api/trpc'` — no codegen, no drift.

## Prerequisites

- Node.js >= 22
- pnpm 10 (`corepack enable`)
- Docker (for Postgres and the API image)

## Getting started

```bash
pnpm install

# 1. Start Postgres
docker compose up -d db

# 2. Configure env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Create the schema
pnpm db:push          # or: pnpm db:generate && pnpm db:migrate

# 4. Run everything
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001 (tRPC at `/trpc`, health at `/health`)

## Scripts

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `pnpm dev`           | Run all apps in dev mode (Turbo)                     |
| `pnpm build`         | Build all apps                                       |
| `pnpm lint`          | Biome lint + format check                            |
| `pnpm lint:fix`      | Biome autofix                                        |
| `pnpm check-types`   | TypeScript type check across the repo                |
| `pnpm db:generate`   | Generate Drizzle migrations from the schema          |
| `pnpm db:migrate`    | Apply migrations                                     |
| `pnpm db:push`       | Push schema directly (dev convenience)               |
| `pnpm db:studio`     | Open Drizzle Studio                                  |
| `pnpm changeset`     | Record a changeset for a release                     |

## Database

Drizzle schema lives in `apps/api/src/db/schema.ts`. After editing it:

```bash
pnpm db:generate   # writes SQL to apps/api/drizzle/
pnpm db:migrate    # applies it
```

## Docker

The API ships as a minimal, fully-bundled image (built with `tsup`, no
`node_modules` at runtime). The build context is the monorepo root:

```bash
docker compose up --build        # Postgres + API
# or build the image alone:
docker build -f apps/api/Dockerfile -t repo-api .
```

## Commits & releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(enforced by commitlint). Allowed scopes: `web`, `api`, `db`, `config`, `ci`,
`deps`, `release`, `repo`.

```
feat(web): add todo filtering
fix(api): handle missing todo on toggle
```

Record release notes with `pnpm changeset`, then `pnpm changeset:version`.
