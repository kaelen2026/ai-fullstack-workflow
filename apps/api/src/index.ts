import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './bindings'
import { appRouter } from './trpc/router'
import { createContext } from './trpc/trpc'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.json({ service: 'api', status: 'ok' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// CORS is configured per-request because the allowed origin comes from env.
app.use('/trpc/*', (c, next) =>
  cors({
    origin: c.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })(c, next),
)

app.use('/trpc/*', (c, next) =>
  trpcServer({
    endpoint: '/trpc',
    router: appRouter,
    createContext: (_opts, ctx) => createContext(ctx),
  })(c, next),
)

export default app
export type { AppRouter } from './trpc/router'
