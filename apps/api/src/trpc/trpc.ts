import { initTRPC, TRPCError } from '@trpc/server'
import type { Context as HonoContext } from 'hono'
import { createAuth } from '../auth'
import type { Bindings } from '../bindings'
import { createDb } from '../db'

/**
 * Per-request context. The Drizzle client is created here from the Hyperdrive
 * connection string on the Worker env (env is only available per request), and
 * better-auth resolves the session from the request cookies.
 */
export async function createContext(c: HonoContext) {
  const env = c.env as Bindings
  const db = createDb(env.HYPERDRIVE.connectionString)
  const auth = createAuth(db, env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  return {
    db,
    auth,
    user: session?.user ?? null,
    session: session?.session ?? null,
    req: c.req,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
export const createCallerFactory = t.createCallerFactory

/** Requires an authenticated session; narrows `ctx.user` to non-null. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be signed in.' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
