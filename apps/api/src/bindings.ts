import type { Hyperdrive } from '@cloudflare/workers-types'

/**
 * Cloudflare Worker bindings. Configured in `wrangler.jsonc`:
 * - HYPERDRIVE: connection pooler/proxy to Supabase Postgres
 * - CORS_ORIGIN: allowed browser origin (the deployed web app)
 */
export type Bindings = {
  HYPERDRIVE: Hyperdrive
  CORS_ORIGIN: string
}
