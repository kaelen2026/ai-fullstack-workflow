import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from '../auth/auth.schema'

// Todos are FK-scoped to the better-auth `user` table (cross-module reference).

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  completed: boolean('completed').notNull().default(false),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
