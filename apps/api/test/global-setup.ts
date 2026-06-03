import { migrationsFolder } from '@repo/db/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { TEST_DATABASE_URL } from './helpers/db'

/**
 * Runs once before the integration project: ensure the dedicated `app_test`
 * database exists (so we never touch the dev `app` DB) and bring it up to the
 * latest schema using the committed drizzle migrations.
 */
export default async function setup() {
  await ensureDatabaseExists(TEST_DATABASE_URL)

  const client = postgres(TEST_DATABASE_URL, { max: 1 })
  const db = drizzle(client)
  await migrate(db, { migrationsFolder })
  await client.end()
}

async function ensureDatabaseExists(url: string) {
  const target = new URL(url)
  const dbName = target.pathname.slice(1)

  // Connect to the maintenance `postgres` database to create the target if absent.
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'
  const admin = postgres(adminUrl.toString(), { max: 1 })
  try {
    const existing = await admin`SELECT 1 FROM pg_database WHERE datname = ${dbName}`
    if (existing.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${dbName}"`)
    }
  } finally {
    await admin.end()
  }
}
