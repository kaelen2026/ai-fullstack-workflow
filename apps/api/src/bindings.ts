import type { Hyperdrive } from '@cloudflare/workers-types'

/**
 * Cloudflare Worker bindings. Configured in `wrangler.jsonc` (vars) and via
 * secrets (`wrangler secret put` / `.dev.vars` locally):
 * - HYPERDRIVE: connection pooler/proxy to Supabase Postgres
 * - CORS_ORIGIN: allowed browser origin (the deployed web app)
 * - BETTER_AUTH_URL: public origin of this API (where /api/auth/* is served)
 * - BETTER_AUTH_SECRET: signing secret for sessions (secret)
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: Google OAuth credentials (secret)
 */
export type Bindings = {
  HYPERDRIVE: Hyperdrive
  CORS_ORIGIN: string
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}
