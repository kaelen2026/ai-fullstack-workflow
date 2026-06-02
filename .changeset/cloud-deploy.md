---
"@repo/api": minor
"@repo/web": minor
---

Deploy targets: the API now runs on Cloudflare Workers (Hono + tRPC) reaching
Supabase Postgres through a Hyperdrive binding + Drizzle, and the web app is
configured for Vercel. Replaces the Node/Docker API server. All free-tier; see
DEPLOYMENT.md.
