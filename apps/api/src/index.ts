import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { appRouter } from './trpc/router'
import { createContext } from './trpc/trpc'

const app = new Hono()

app.use('*', logger())
app.use(
  '/trpc/*',
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
)

app.get('/', (c) => c.json({ service: 'api', status: 'ok' }))
app.get('/health', (c) => c.json({ status: 'healthy', uptime: process.uptime() }))

app.use(
  '/trpc/*',
  trpcServer({
    endpoint: '/trpc',
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  }),
)

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 API listening on http://localhost:${info.port}`)
})

export type { AppRouter } from './trpc/router'
export default app
