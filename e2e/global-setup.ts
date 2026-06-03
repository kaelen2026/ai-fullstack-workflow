import { execSync } from 'node:child_process'

/**
 * Ensure the dev `app` database (the one the running Worker reaches via the
 * Hyperdrive local connection string) has the latest schema before the browser
 * journey runs. Reuses the repo's drizzle-kit migrate flow.
 */
export default function globalSetup() {
  execSync('pnpm --filter @repo/db db:migrate', { stdio: 'inherit', env: process.env })
}
