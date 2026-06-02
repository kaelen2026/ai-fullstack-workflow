# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- [`.claude/rules/workflow.md`](.claude/rules/workflow.md) — how changes land: branch off `main`, run lint/types/build, Conventional Commits, PR + squash merge, and the DB generate/migrate flow. Follow it for any commit, PR, or schema change.

## Commands

All commands run from the repo root unless noted. Tasks are orchestrated by Turborepo.

```bash
pnpm dev            # run web (:3000) + api (:3001) together
pnpm build          # build all (web: next build, api: tsup bundle)
pnpm lint           # Biome check (lint + format), repo-wide
pnpm lint:fix       # Biome autofix + format write
pnpm check-types    # tsc --noEmit across packages
```

Target a single package with `--filter`:

```bash
pnpm --filter @repo/api dev        # wrangler dev (Worker in workerd, :3001)
pnpm --filter @repo/api deploy     # wrangler deploy (needs wrangler login + Hyperdrive id)
pnpm --filter @repo/api build      # wrangler deploy --dry-run (validates the bundle, no auth)
pnpm --filter @repo/web build
```

`apps/api` runs on **Cloudflare Workers**, not Node — there is no `start`/`serve`.
Deployment (Vercel + Cloudflare + Supabase, all free tier) is in `DEPLOYMENT.md`.

### Database (Drizzle + Postgres)

Local Postgres runs in Docker; production is Supabase (reached via Hyperdrive). Migrations (`db:*`) run on Node via drizzle-kit against `DATABASE_URL` in `apps/api/.env` — the running Worker never reads that file.

```bash
docker compose up -d db    # start Postgres (:5432, db "app", postgres/postgres)
pnpm db:generate           # generate SQL migration from schema changes
pnpm db:migrate            # apply migrations (non-interactive — use this in scripts/CI)
pnpm db:push               # push schema directly — INTERACTIVE, needs a TTY (dev only)
pnpm db:studio             # Drizzle Studio
```

After editing `apps/api/src/db/schema.ts`, run `db:generate` then `db:migrate`. `db:push` prompts for confirmation and will fail in a non-TTY shell — prefer the generate/migrate flow when running programmatically.

### Releases

Conventional Commits are enforced by commitlint (commit-msg hook). Allowed scopes: `web`, `api`, `db`, `config`, `ci`, `deps`, `release`, `repo`. Record release notes with `pnpm changeset`, then `pnpm changeset:version`.

There is no test runner configured yet.

## Architecture

Turborepo + pnpm-workspace monorepo. Dependency versions for shared tooling/libs are pinned centrally in the `catalog:` block of `pnpm-workspace.yaml` (referenced as `"catalog:"` in each package.json) — bump versions there, not per-package.

- **`apps/api`** — Hono app (`src/index.ts`, `export default app`) running on **Cloudflare Workers**, mounting tRPC v11 at `/trpc` via `@hono/trpc-server`, plus `/health`. Worker bindings are typed in `src/bindings.ts` (`HYPERDRIVE`, `CORS_ORIGIN`). There is no module-scope env or db on Workers: the request `Context` in `src/trpc/trpc.ts` builds a Drizzle client per request via `createDb(c.env.HYPERDRIVE.connectionString)` (`src/db/index.ts`, postgres-js). tRPC procedures live in `src/trpc/routers/*` and compose into `appRouter` in `src/trpc/router.ts`.
- **`apps/web`** — Next.js 16 App Router, deployed to **Cloudflare Workers via `@opennextjs/cloudflare`** (`open-next.config.ts` + `wrangler.jsonc`; `cf-build`/`deploy` scripts). The tRPC client uses the modern `@trpc/tanstack-react-query` integration: `src/trpc/client.tsx` exports `useTRPC` + `TRPCReactProvider` (wrapped around the app in `layout.tsx`). Components call `useQuery(trpc.x.queryOptions())` / `useMutation(trpc.x.mutationOptions())`. shadcn/ui (new-york style, Tailwind v4) lives under `src/components/ui`, `cn` in `src/lib/utils.ts`. `NEXT_PUBLIC_API_URL` (the api origin) is baked at build time, so each environment is built separately.
- **`packages/typescript-config`** — shared `base.json` / `nextjs.json` / `node.json` tsconfigs (strict, `verbatimModuleSyntax`, bundler resolution).

### Branches & environments

`dev` is the **default + protected** branch (PRs require CI; squash + linear history). `main` is production and allows **direct pushes** (no PR). GitHub Actions drive all deploys (see `.github/workflows/` + `DEPLOYMENT.md`):

- PR → `dev`: preview Workers `aifw-{web,api}-pr-<N>` at `preview-<N>[-api].w3ctech.dev` (share the dev DB); torn down on PR close.
- push to `dev`: `dev[-api].w3ctech.dev`. push/promote to `main` then manual `workflow_dispatch`: `w3ctech.dev` / `api.w3ctech.dev`.
- Both apps deploy as Cloudflare Workers via `wrangler --env {dev,production}` (api uses per-env Hyperdrive ids in `apps/api/wrangler.jsonc`); previews use `--name` + a custom-domain API call (`.github/scripts/`).

### Cross-package type safety (the key wiring)

The web app gets full end-to-end types with **no codegen**: `apps/api` exposes its router type via the `"./trpc"` export (`package.json` → `./src/trpc/router.ts`), and web imports `import type { AppRouter } from '@repo/api/trpc'`. This is type-only — no API runtime code is bundled into web. When you add/rename a procedure in the API, the web call sites type-check against it immediately.

### Worker runtime (non-obvious)

- `wrangler.jsonc` carries `compatibility_flags: ["nodejs_compat"]` — required for the `postgres` driver to run on Workers. Don't remove it.
- The Worker reaches Postgres only through the **Hyperdrive** binding. In `wrangler dev` the binding uses `localConnectionString` (Docker Postgres); in production it uses the Hyperdrive `id` (set after `wrangler hyperdrive create`). The DB connection string is never in env vars or the repo.
- `apps/api/tsconfig.json` uses `@cloudflare/workers-types` only (no `@types/node`) to avoid global clashes; `drizzle.config.ts` is excluded from `tsc` (drizzle-kit runs it on Node directly).
- The `build` script is `wrangler deploy --dry-run` — it bundles + validates the Worker without auth, so CI catches a broken Worker before deploy.

## Tooling notes

- **Biome** (not ESLint/Prettier) is the single linter+formatter. `biome.json` enables `css.parser.tailwindDirectives` so Tailwind v4 `@apply`/`@theme`/`@custom-variant` in `globals.css` parse correctly. Keep the `$schema` version in `biome.json` matching the installed CLI version.
- **husky + lint-staged**: pre-commit runs Biome on staged files; commit-msg runs commitlint.
- Native install scripts are gated by pnpm — `esbuild`, `sharp` (Next image opt), and `workerd` (wrangler's runtime) are allowlisted under `onlyBuiltDependencies` in `pnpm-workspace.yaml`.
