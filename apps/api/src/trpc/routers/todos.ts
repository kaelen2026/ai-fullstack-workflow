import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { todos } from '../../db/schema'
import { protectedProcedure, router } from '../trpc'

export const todosRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(todos)
      .where(eq(todos.userId, ctx.user.id))
      .orderBy(desc(todos.createdAt))
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().trim().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      const [todo] = await ctx.db
        .insert(todos)
        .values({ title: input.title, userId: ctx.user.id })
        .returning()
      return todo
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(todos)
        .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })
      }

      const [updated] = await ctx.db
        .update(todos)
        .set({ completed: !existing.completed })
        .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id)))
        .returning()
      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(todos).where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id)))
      return { id: input.id }
    }),
})
