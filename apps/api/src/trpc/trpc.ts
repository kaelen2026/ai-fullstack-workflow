import { initTRPC } from '@trpc/server'
import type { Context as HonoContext } from 'hono'
import type { Bindings } from '../bindings'
import { createDb } from '../db'

/**
 * Per-request context. The Drizzle client is created here from the Hyperdrive
 * connection string on the Worker env (env is only available per request).
 */
export function createContext(c: HonoContext) {
  const env = c.env as Bindings
  return {
    db: createDb(env.HYPERDRIVE.connectionString),
    req: c.req,
  }
}

export type Context = ReturnType<typeof createContext>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
export const createCallerFactory = t.createCallerFactory
