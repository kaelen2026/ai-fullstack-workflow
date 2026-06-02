# ai-fullstack-workflow

A type-safe full-stack monorepo powered by [Turborepo](https://turbo.build) and pnpm workspaces.

## Stack

| App / Package              | Tech                                                                    |
| -------------------------- | ----------------------------------------------------------------------- |
| `apps/web`                 | Next.js 16 (App Router) · Tailwind CSS v4 · shadcn/ui · React Query — deploys to **Vercel** |
| `apps/api`                 | Hono · tRPC v11 · Zod · Drizzle ORM — runs on **Cloudflare Workers** (Hyperdrive → **Supabase** Postgres) |
| `packages/typescript-config` | Shared `tsconfig` presets                                             |

Tooling: **Biome** (lint + format), **husky** + **lint-staged** (git hooks),
**commitlint** (conventional commits), **Changesets** (versioning + changelog),
**GitHub Actions** (CI).

End-to-end type safety: the web app imports the API's router type via
`import type { AppRouter } from '@repo/api/trpc'` — no codegen, no drift.

## Prerequisites

- Node.js >= 22 (pinned in `.nvmrc`)
- pnpm 10 (`corepack enable`)
- Docker (for the local Postgres)

## Getting started

```bash
pnpm install

# 1. Start Postgres
docker compose up -d db

# 2. Configure env
cp apps/api/.env.example apps/api/.env   # DATABASE_URL for migrations
cp apps/web/.env.example apps/web/.env   # NEXT_PUBLIC_API_URL

# 3. Create the schema
pnpm db:migrate          # or, for a quick dev push: pnpm db:push

# 4. Run everything
pnpm dev
```

- Web (Next.js): http://localhost:3000
- API (Worker via `wrangler dev`): http://localhost:3001 (tRPC at `/trpc`, health at `/health`)

The Worker reaches Postgres through its Hyperdrive binding; in `wrangler dev`
that binding uses `localConnectionString` (the Docker Postgres) — no Cloudflare
account needed for local work.

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

## Deployment

Web → **Vercel**, API → **Cloudflare Workers** (Hyperdrive), DB → **Supabase**,
all on free tiers. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide.

```bash
pnpm deploy:api    # wrangler deploy (after wrangler login + Hyperdrive setup)
```

## Docker

Docker provides the **Postgres database** for local development; the apps run
on the host via `pnpm dev`.

```bash
docker compose up -d db     # start Postgres
docker compose down         # stop it (add -v to wipe data)
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
