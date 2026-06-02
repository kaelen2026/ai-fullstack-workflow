/**
 * Aggregated Drizzle schema.
 *
 * Each module owns its own tables (`modules/<name>/<name>.schema.ts`); this file
 * re-exports them so there is a single schema object for the Drizzle client
 * (`drizzle(sql, { schema })`) and for drizzle-kit (`drizzle.config.ts`).
 * Add a module's schema here when you create it.
 */
export * from '../../modules/auth/auth.schema'
export * from '../../modules/todos/todos.schema'
