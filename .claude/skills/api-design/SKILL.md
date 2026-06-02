---
name: api-design
description: >-
  Design and add API endpoints in this monorepo. The API is tRPC v11 procedures
  on a Hono app running on Cloudflare Workers, with Drizzle/Postgres (per-request
  via Hyperdrive), better-auth sessions, and zod-validated inputs; the web app
  consumes the router type with no codegen. Use when adding, renaming, or changing
  a tRPC procedure or router, designing a new resource's endpoints, wiring input
  validation/auth/error handling, or keeping the web↔api type contract intact.
---

# API design

Operational guide for building API endpoints in this repo. The hard rules live in
[`.claude/rules/api-design.md`](../../rules/api-design.md); this skill is the
how-to with worked examples and the gotchas specific to running tRPC on Workers.

## The stack in one breath

```
web (Next on Workers) ──useTRPC()──▶ /trpc ──▶ Hono app (Worker)
                                                 └─ appRouter (tRPC v11)
                                                      └─ ctx.db (Drizzle, per-request via Hyperdrive)
                                                      └─ ctx.user (better-auth session)
```

No env or db at module scope on Workers — both are built **per request** in
`createContext` (`apps/api/src/core/trpc/trpc.ts`). Always reach them through `ctx`.

## Anatomy of a module

The API is organized by **feature module**: shared infrastructure in `core/`, one
vertical slice per resource in `modules/<resource>/`. A module owns its table
(`<resource>.schema.ts`) and its router (`<resource>.router.ts`).

`apps/api/src/modules/<resource>/<resource>.router.ts` — one router per resource:

```ts
import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../../core/trpc/trpc'
import { widgets } from './widgets.schema'

export const widgetsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(widgets)
      .where(eq(widgets.userId, ctx.user.id))      // always scope to the user
      .orderBy(desc(widgets.createdAt)),
  ),

  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(256) }))   // validate everything
    .mutation(async ({ ctx, input }) => {
      const [widget] = await ctx.db
        .insert(widgets)
        .values({ name: input.name, userId: ctx.user.id })
        .returning()
      return widget
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(widgets)
        .where(and(eq(widgets.id, input.id), eq(widgets.userId, ctx.user.id)))
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Widget not found' })

      await ctx.db
        .delete(widgets)
        .where(and(eq(widgets.id, input.id), eq(widgets.userId, ctx.user.id)))  // scope in WHERE too
      return { id: input.id }
    }),
})
```

Then register it in `apps/api/src/core/trpc/router.ts`:

```ts
import { widgetsRouter } from '../../modules/widgets/widgets.router'
// ...
export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' as const })),
  todos: todosRouter,
  widgets: widgetsRouter,   // ← add here
})
```

The `todos` module (`apps/api/src/modules/todos/`) is the reference implementation — mirror it.

## Adding an endpoint — checklist

1. **Need a table?** Add `apps/api/src/modules/<name>/<name>.schema.ts` and re-export it from `apps/api/src/core/db/schema.ts`, then `pnpm db:generate` && `pnpm db:migrate` (not `db:push` — it needs a TTY). Scope app tables to a user with a `userId` FK + `onDelete: 'cascade'`.
2. **Pick the procedure base:** `protectedProcedure` for user-owned data, `publicProcedure` only if truly unauthenticated.
3. **Pick query vs mutation:** reads → `.query()`, writes → `.mutation()`.
4. **Validate input** with `.input(z.object({...}))` — tight bounds, no loose strings/numbers.
5. **Scope to `ctx.user.id`** in every `WHERE`, including update/delete. Check ownership before acting; `throw new TRPCError({ code: 'NOT_FOUND' })` if the row isn't the user's.
6. **Return the row** via `.returning()`, or a minimal `{ id }` for deletes.
7. **Register** the router in `router.ts` if it's new.
8. **Verify the contract:** `pnpm check-types` then `pnpm build` — type errors in the web app mean a call site needs updating.

## Calling it from web

The web client is the modern `@trpc/tanstack-react-query` integration
(`apps/web/src/trpc/client.tsx`, `useTRPC`). No codegen — the type flows from
`import type { AppRouter } from '@repo/api/trpc'`.

```tsx
const trpc = useTRPC()
const { data } = useQuery(trpc.widgets.list.queryOptions())
const create = useMutation(trpc.widgets.create.mutationOptions())
// create.mutate({ name: 'thing' })
```

Renaming/removing a procedure breaks these call sites at type-check time — fix
them in the same PR.

## Workers gotchas (why the patterns exist)

- **No module-scope db/env.** `ctx.db` is built per request from `env.HYPERDRIVE.connectionString`; `ctx.user` from the better-auth session. Never cache a client across requests or read `process.env`.
- **Cross-site cookies.** web and api are different origins in prod; the session cookie is `SameSite=None; Secure` and the client sends `credentials: 'include'`. `CORS_ORIGIN` must be the exact web origin or auth silently fails — don't widen CORS to fix a 401.
- **`protectedProcedure` is the auth boundary.** Don't re-check `ctx.user` manually in a protected procedure — it's already narrowed to non-null. Do still check row **ownership** for any id from input.
- **Errors must be `TRPCError`** so the client gets a real code. Bare `throw new Error()` surfaces as an opaque 500.

## Conventions

- Routers: `<resource>Router`, plural, keyed by resource in `appRouter`.
- Procedures: short verbs — `list`, `get`, `create`, `update`, `toggle`, `delete`.
- Commit scope for API changes is `api` (Conventional Commits — see [`workflow.md`](../../rules/workflow.md)).
