import { trpcServer } from '@hono/trpc-server'
import { type Context, Hono, type Next } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './auth'
import type { Bindings } from './bindings'
import { createDb } from './db'
import { type LoggerVariables, requestLogger } from './middleware/logger'
import { appRouter } from './trpc/router'
import { createContext } from './trpc/trpc'

const app = new Hono<{ Bindings: Bindings; Variables: LoggerVariables }>()

// Structured per-request logging to Workers Logs — first so it wraps everything.
app.use('*', requestLogger)

app.get('/', (c) => c.json({ service: 'api', status: 'ok' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// CORS is configured per-request because the allowed origin comes from env.
// Credentials must be allowed so the cross-site session cookie is sent.
const withCors = (c: Context<{ Bindings: Bindings }>, next: Next) =>
  cors({
    origin: c.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })(c, next)

// better-auth handler: mounted per request (no module-scope env on Workers).
app.use('/api/auth/*', withCors)
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const db = createDb(c.env.HYPERDRIVE.connectionString)
  const auth = createAuth(db, c.env)
  return auth.handler(c.req.raw)
})

app.use('/trpc/*', withCors)
app.use('/trpc/*', (c, next) =>
  trpcServer({
    endpoint: '/trpc',
    router: appRouter,
    createContext: (_opts, ctx) => createContext(ctx),
  })(c, next),
)

export default app
export type { AppRouter } from './trpc/router'
