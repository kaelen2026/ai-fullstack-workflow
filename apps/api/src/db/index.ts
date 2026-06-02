import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Build a Drizzle client for a single Worker request.
 *
 * On Workers there is no module-scope env, and Hyperdrive hands us a fresh
 * connection string per request. Hyperdrive does the real pooling, so the
 * driver is configured for short-lived, non-prepared connections.
 */
export function createDb(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 5,
    fetch_types: false,
    prepare: false,
  })
  return drizzle(sql, { schema })
}

export { schema }
export type Database = ReturnType<typeof createDb>
