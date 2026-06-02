import { initTRPC } from '@trpc/server'
import type { Context as HonoContext } from 'hono'
import { db } from '../db'

/**
 * Per-request context. Anything returned here is available on `ctx` in every
 * procedure (db handle, request, auth, etc.).
 */
export async function createContext(c: HonoContext) {
  return {
    db,
    req: c.req,
    header: (name: string) => c.req.header(name),
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
export const createCallerFactory = t.createCallerFactory
