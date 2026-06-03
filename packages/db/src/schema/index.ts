/**
 * Aggregated Drizzle schema.
 *
 * Each resource owns a file in this folder (`schema/<name>.ts`); this barrel
 * re-exports them so there is a single schema object for the Drizzle client
 * (`drizzle(sql, { schema })`) and for drizzle-kit (`drizzle.config.ts`).
 * Add a resource's schema here when you create it.
 */
export * from './auth'
export * from './todos'
