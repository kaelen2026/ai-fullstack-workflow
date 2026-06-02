# Deployment

Production topology (all free-tier):

```
Browser ── HTTPS ──> Vercel (Next.js web)
                         │  tRPC over HTTPS (NEXT_PUBLIC_API_URL)
                         ▼
                 Cloudflare Worker (Hono + tRPC)
                         │  Hyperdrive binding (pooled)
                         ▼
                  Supabase Postgres
```

| Piece | Platform | Free tier |
| ----- | -------- | --------- |
| `apps/web` | Vercel (Hobby) | yes |
| `apps/api` | Cloudflare Workers + Hyperdrive | yes |
| Database | Supabase Postgres | yes (500 MB; pauses after ~1 week idle) |

You need accounts on all three. Wrangler is already a dev dependency; the
Vercel and Supabase steps use their dashboards (no extra CLI required).

---

## 1. Supabase (database)

1. Create a project at https://supabase.com/dashboard. Save the database
   password you set.
2. **Project Settings → Database → Connection string.** You need the
   **Session pooler** string (IPv4, port `5432`, Supavisor session mode) —
   used for both Hyperdrive and migrations:

   ```
   postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

3. Run the Drizzle migrations against it from your machine:

   ```bash
   cd apps/api
   echo 'DATABASE_URL=postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres' > .env
   pnpm db:migrate          # applies drizzle/*.sql (creates the todos table)
   ```

   (`.env` is gitignored and only used by drizzle-kit — the Worker never reads it.)

---

## 2. Cloudflare Worker (api)

From `apps/api`:

```bash
pnpm exec wrangler login        # opens a browser; or: ! pnpm exec wrangler login
```

1. **Create a Hyperdrive config** pointing at the Supabase Session-pooler string:

   ```bash
   pnpm exec wrangler hyperdrive create ai-fullstack-db \
     --connection-string="postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```

   Copy the printed **id** into `apps/api/wrangler.jsonc` →
   `hyperdrive[0].id` (replacing `REPLACE_WITH_YOUR_HYPERDRIVE_ID`).

2. **Deploy:**

   ```bash
   pnpm --filter @repo/api deploy      # or: pnpm deploy:api
   ```

   Note the URL it prints, e.g.
   `https://ai-fullstack-workflow-api.<your-subdomain>.workers.dev`.

3. Verify:

   ```bash
   curl https://ai-fullstack-workflow-api.<sub>.workers.dev/health
   curl https://ai-fullstack-workflow-api.<sub>.workers.dev/trpc/todos.list
   ```

> The Hyperdrive `id` is the only thing you must commit. The Supabase
> credentials live inside the Hyperdrive config on Cloudflare, never in the repo.

---

## 3. Vercel (web)

1. Import the GitHub repo at https://vercel.com/new.
2. **Root Directory → `apps/web`.** Vercel reads `apps/web/vercel.json`
   (framework `nextjs`; install/build run from the monorepo root so the pnpm
   workspace links correctly).
3. **Environment variable:**

   ```
   NEXT_PUBLIC_API_URL = https://ai-fullstack-workflow-api.<your-subdomain>.workers.dev
   ```

4. Deploy. Vercel gives you a URL like `https://<app>.vercel.app`.

---

## 4. Wire CORS (one-time, after you know the Vercel URL)

The Worker only allows requests from `CORS_ORIGIN`. Point it at the Vercel
domain — either edit `apps/api/wrangler.jsonc` (`vars.CORS_ORIGIN`) and
re-deploy, or set it without a commit:

```bash
# Cloudflare dashboard: Workers & Pages → ai-fullstack-workflow-api →
# Settings → Variables and Secrets → add CORS_ORIGIN = https://<app>.vercel.app
# then redeploy, or:
cd apps/api && pnpm exec wrangler deploy --var CORS_ORIGIN:https://<app>.vercel.app
```

Re-deploy the Worker after changing it. Done — the web app now talks to the
Worker, which queries Supabase through Hyperdrive.

---

## 5. Auth secrets (better-auth)

The Worker serves better-auth at `/api/auth/*`. It needs one var and one or
more secrets. The var goes in `wrangler.jsonc`; secrets are set with
`wrangler secret put` (never committed):

```bash
cd apps/api
# Public origin of THIS api (flips cookies to cross-site Secure when https://).
pnpm exec wrangler deploy --var BETTER_AUTH_URL:https://ai-fullstack-workflow-api.<sub>.workers.dev

# Session signing secret (generate one):
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))" | pnpm exec wrangler secret put BETTER_AUTH_SECRET

# Google OAuth (optional — email/password works without it):
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
```

For Google OAuth, create credentials at
https://console.cloud.google.com/apis/credentials and set the authorized
redirect URI to `<BETTER_AUTH_URL>/api/auth/callback/google`.

Because web and api live on different sites in production, the session cookie is
issued `SameSite=None; Secure` (see `apps/api/src/auth.ts`) and the clients send
`credentials: 'include'`. `CORS_ORIGIN` must be the exact web origin (not `*`).

---

## Local development (no cloud needed)

`wrangler dev` runs the Worker in the real Workers runtime, and the Hyperdrive
binding's `localConnectionString` points at the Docker Postgres:

```bash
docker compose up -d db
cd apps/api
cp .env.example .env               # DATABASE_URL for drizzle-kit migrations
cp .dev.vars.example .dev.vars     # BETTER_AUTH_SECRET (+ optional Google creds)
pnpm db:migrate
cd ../.. && pnpm dev               # web :3000 + worker :3001
```

Locally both apps run on `http://localhost` (same site), so the cookie stays
`SameSite=Lax` and works without HTTPS.

## Notes & gotchas

- **Supabase free projects pause after ~1 week of inactivity** — the first
  request after that will fail until you resume it from the dashboard.
- Use the **Session pooler** string, not the Transaction pooler (`6543`):
  Hyperdrive does its own pooling and session mode is the compatible choice.
  The driver is already set with `prepare: false`.
- `nodejs_compat` (in `wrangler.jsonc`) is required for the `postgres` driver
  to run on Workers — don't remove it.
- CI builds the Worker with `wrangler deploy --dry-run` (no account needed), so
  a broken Worker bundle fails the `build` check before you ever deploy.
