# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
pnpm --filter @repo/api dev        # tsx watch (hot reload)
pnpm --filter @repo/api start      # run the built dist/index.js (production bundle)
pnpm --filter @repo/web build
```

### Database (Drizzle + Postgres)

Postgres runs in Docker; everything else runs on the host.

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

- **`apps/api`** — Hono server (`src/index.ts`) mounting tRPC v11 at `/trpc` via `@hono/trpc-server`, plus `/health`. Env is validated by Zod in `src/env.ts` (process exits on invalid env). Data layer is Drizzle ORM over postgres-js (`src/db/`). tRPC procedures live in `src/trpc/routers/*` and compose into `appRouter` in `src/trpc/router.ts`; the request `Context` (db handle, request) is built in `src/trpc/trpc.ts`.
- **`apps/web`** — Next.js 16 App Router. The tRPC client uses the modern `@trpc/tanstack-react-query` integration: `src/trpc/client.tsx` exports `useTRPC` + `TRPCReactProvider` (wrapped around the app in `layout.tsx`). Components call `useQuery(trpc.x.queryOptions())` / `useMutation(trpc.x.mutationOptions())`. shadcn/ui (new-york style, Tailwind v4) lives under `src/components/ui`, `cn` in `src/lib/utils.ts`.
- **`packages/typescript-config`** — shared `base.json` / `nextjs.json` / `node.json` tsconfigs (strict, `verbatimModuleSyntax`, bundler resolution).

### Cross-package type safety (the key wiring)

The web app gets full end-to-end types with **no codegen**: `apps/api` exposes its router type via the `"./trpc"` export (`package.json` → `./src/trpc/router.ts`), and web imports `import type { AppRouter } from '@repo/api/trpc'`. This is type-only — no API runtime code is bundled into web. When you add/rename a procedure in the API, the web call sites type-check against it immediately.

### API build (non-obvious)

`tsup` bundles the API and **all dependencies** into a single ESM `dist/index.js` (`noExternal: [/.*/]`), so the production output needs no `node_modules`. Bundling CJS deps into ESM requires the `createRequire` banner in `tsup.config.ts` — removing it reintroduces a `Dynamic require of "fs"` crash at startup. `tsc` is type-check only here (no emit).

## Tooling notes

- **Biome** (not ESLint/Prettier) is the single linter+formatter. `biome.json` enables `css.parser.tailwindDirectives` so Tailwind v4 `@apply`/`@theme`/`@custom-variant` in `globals.css` parse correctly. Keep the `$schema` version in `biome.json` matching the installed CLI version.
- **husky + lint-staged**: pre-commit runs Biome on staged files; commit-msg runs commitlint.
- Native install scripts are gated by pnpm — `esbuild` (powers tsup) and `sharp` (Next image opt) are allowlisted under `onlyBuiltDependencies` in `pnpm-workspace.yaml`.
