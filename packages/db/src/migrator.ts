import { fileURLToPath } from 'node:url'

/**
 * Absolute path to the committed SQL migrations (drizzle-kit's `out` dir).
 *
 * Node-only (uses `node:url`) — kept in its own entry so the Worker bundle,
 * which only imports the main entry, never pulls it in. Used by drizzle's
 * `migrate()` in scripts and the test global-setup.
 */
export const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))
