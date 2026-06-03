# refactor/db-package

**Goal:** Extract the data layer into a standalone `@repo/db` package so a second app can share it.

**Base:** stacked on `feat/password-reset-resend`.

## Scope

Move the Drizzle client, schema, and migrations out of `apps/api` into `packages/db`:

- `packages/db/src/index.ts` (`createDb`, `Database`, re-exports schema), `src/schema/{index,auth,todos}.ts`, `src/migrator.ts` (Node-only `migrationsFolder`), `drizzle/` (migrations), `drizzle.config.ts`, `.env(.example)`.
- Exports: `@repo/db` (client + schema), `@repo/db/schema` (tables), `@repo/db/migrator` (path).
- `apps/api` consumes `@repo/db` (`index.ts`, `trpc.ts`, `auth.ts`, `todos.router.ts`, tests); drops `core/db/`, `drizzle.config.ts`, the module `*.schema.ts` files, and the `db:*` scripts.
- Promote `drizzle-orm`/`drizzle-kit`/`postgres`/`dotenv` into the `catalog:`; root `db:studio` → `@repo/db`.
- Docs updated (`CLAUDE.md`, `api-design.md`, `workflow.md`, `DEPLOYMENT.md`): tables now live in `@repo/db`, not colocated per module.

## Trade-off

Abandons per-module schema colocation (documented previously) in favour of a single shared data-layer package. Chosen because a second consumer is expected.

## Verification

`pnpm check-types`, `pnpm lint`, api Worker bundle, `pnpm --filter @repo/api test` (15/15), `pnpm db:generate` (no drift).
