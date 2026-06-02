import { todosRouter } from './routers/todos'
import { publicProcedure, router } from './trpc'

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' as const })),
  todos: todosRouter,
})

/**
 * The API surface type consumed by the web app's tRPC client.
 * Import it with `import type { AppRouter } from '@repo/api/trpc'`.
 */
export type AppRouter = typeof appRouter
