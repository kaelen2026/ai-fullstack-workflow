import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { Database } from '../../src/core/db'
import * as schema from '../../src/core/db/schema'

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/app_test'

/** A Drizzle client for the test database, plus a `close()` to release the pool. */
export function createTestDb() {
  const client = postgres(TEST_DATABASE_URL, { max: 1 })
  const db = drizzle(client, { schema }) as Database
  return { db, close: () => client.end() }
}

/** Wipe every table between tests so each starts from a clean slate. */
export async function truncateAll(db: Database) {
  await db.execute(
    sql`TRUNCATE TABLE todos, "session", account, verification, "user" RESTART IDENTITY CASCADE`,
  )
}

/** Insert a user row (todos are FK-scoped to it) and return it. */
export async function seedUser(
  db: Database,
  overrides: Partial<{ id: string; name: string; email: string }> = {},
) {
  const id = overrides.id ?? `user_${crypto.randomUUID()}`
  const [row] = await db
    .insert(schema.user)
    .values({
      id,
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? `${id}@example.com`,
    })
    .returning()
  return row
}
