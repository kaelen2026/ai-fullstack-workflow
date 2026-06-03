# API design rules

How API endpoints are shaped in this repo. The API is **tRPC v11** procedures mounted under `/trpc` on a **Hono app running on Cloudflare Workers**. The web app consumes them with end-to-end types and **no codegen**. Follow this whenever you add, rename, or change a procedure.

## Where things live

The API is organized **modularly**: cross-cutting infrastructure in `apps/api/src/core/*`, one router slice per resource in `apps/api/src/modules/<name>/*`. Tables live in the shared `@repo/db` package (`packages/db/src/schema/*`).

- Procedures live in a per-resource router at `apps/api/src/modules/<name>/<name>.router.ts` (one router per resource, e.g. `todos/todos.router.ts`).
- Compose each router into `appRouter` in `apps/api/src/core/trpc/router.ts`.
- Building blocks (`router`, `publicProcedure`, `protectedProcedure`, `middleware`) come from `apps/api/src/core/trpc/trpc.ts` — import them, don't re-init tRPC.
- Tables live in the shared **`@repo/db`** package: `packages/db/src/schema/<name>.ts`, re-exported from the aggregator `packages/db/src/schema/index.ts`. Routers import tables from `@repo/db`. A schema change follows the DB flow in [`workflow.md`](./workflow.md) (`pnpm db:generate` → `pnpm db:migrate`).

## Procedure rules

- **Queries read, mutations write.** Use `.query()` for reads, `.mutation()` for anything that changes state. Never mutate inside a query.
- **Auth by default.** Use `protectedProcedure` for anything user-owned — it throws `UNAUTHORIZED` and narrows `ctx.user` to non-null. Reserve `publicProcedure` for genuinely unauthenticated endpoints (e.g. `health`).
- **Validate every input with zod.** `.input(z.object({ ... }))` with tight constraints (`.trim().min(1).max(256)`, `z.number().int().positive()`). No unvalidated `input`. Output validation is optional; rely on inferred return types.
- **Scope every query to the user.** Always filter by `ctx.user.id` (`eq(table.userId, ctx.user.id)`), including in `update`/`delete` `WHERE` clauses — never trust an id from input alone. Confirm a row exists/belongs to the user before acting; throw `NOT_FOUND` otherwise.
- **Use the request-scoped db.** Query through `ctx.db` only. There is no module-scope db or env on Workers — never import a global client or read `process.env`.
- **Errors are `TRPCError`.** Throw `new TRPCError({ code, message })` with a real code (`UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`, `FORBIDDEN`, `CONFLICT`, …). Don't throw bare `Error` or return error-shaped objects.
- **Return data, not envelopes.** Return the row(s) or a minimal result (`return { id }` after delete). Use Drizzle `.returning()` to hand back the affected row.

## Naming

- Procedures: short verbs scoped by their router — `list`, `create`, `toggle`, `delete`, `get`, `update`.
- Routers: plural resource name exported as `<resource>Router` (e.g. `todosRouter`), keyed by the resource in `appRouter` (`todos: todosRouter`).

## Keep the contract intact

The web app imports `import type { AppRouter } from '@repo/api/trpc'` (type-only — no API runtime in the web bundle). Call sites use `trpc.<router>.<proc>.queryOptions()` / `.mutationOptions()`. Adding/renaming a procedure type-checks against web immediately:

- After any procedure change, run `pnpm check-types` (catches broken web call sites) and `pnpm build`.
- Renaming or removing a procedure is a breaking change to the web client — update the call sites in the same PR.
