import { TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { todos } from '../../db/schema'
import { publicProcedure, router } from '../trpc'

export const todosRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(todos).orderBy(desc(todos.createdAt))
  }),

  create: publicProcedure
    .input(z.object({ title: z.string().trim().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      const [todo] = await ctx.db.insert(todos).values({ title: input.title }).returning()
      return todo
    }),

  toggle: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(todos).where(eq(todos.id, input.id))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })
      }

      const [updated] = await ctx.db
        .update(todos)
        .set({ completed: !existing.completed })
        .where(eq(todos.id, input.id))
        .returning()
      return updated
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(todos).where(eq(todos.id, input.id))
      return { id: input.id }
    }),
})
