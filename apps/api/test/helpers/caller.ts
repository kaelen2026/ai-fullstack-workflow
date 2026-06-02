import type { Database } from '../../src/core/db'
import { appRouter } from '../../src/core/trpc/router'
import { type Context, createCallerFactory } from '../../src/core/trpc/trpc'

const createCaller = createCallerFactory(appRouter)

type TestUser = { id: string }

/**
 * Build a tRPC caller with a minimal context. The todos procedures only read
 * `ctx.db` and `ctx.user`; `auth`/`req`/`session` are stubbed. Pass `user: null`
 * to exercise the `protectedProcedure` (UNAUTHORIZED) path.
 */
export function createTestCaller(opts: { db: Database; user: TestUser | null }) {
  const ctx = {
    db: opts.db,
    user: opts.user,
    session: opts.user ? { userId: opts.user.id } : null,
    auth: undefined,
    req: undefined,
  } as unknown as Context

  return createCaller(ctx)
}
