# Deployment

Everything runs on **Cloudflare Workers** (web via OpenNext, api as a Worker)
with **Supabase** Postgres behind **Hyperdrive**. Deploys are orchestrated by
GitHub Actions. Domains live on Cloudflare (`w3ctech.dev`).

## Environments

| Env | Trigger | Web | API | Database |
| --- | --- | --- | --- | --- |
| **preview** | open/update a PR → `dev` | `preview-<N>.w3ctech.dev` | `preview-<N>-api.w3ctech.dev` | shared **dev** DB |
| **dev** | push to `dev` (PR merge) | `dev.w3ctech.dev` | `dev-api.w3ctech.dev` | **dev** DB |
| **production** | manual `workflow_dispatch` after `dev`→`main` | `w3ctech.dev` | `api.w3ctech.dev` | **prod** DB |

Closing a PR tears its preview Workers + domains down automatically.

```
PR → dev ──(merge)──> dev branch ──(auto)──> dev.w3ctech.dev
                          │
                   (merge dev→main, no PR)
                          ▼
                   main ──(manual: Actions → Deploy production)──> w3ctech.dev
```

---

## One-time setup

### 1. Supabase — two projects

Create **prod** and **dev** projects at https://supabase.com/dashboard. For
each, grab the **Session pooler** connection string (Settings → Database, IPv4,
port `5432`):

```
postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

### 2. Cloudflare — Hyperdrive (one per database)

```bash
wrangler login
wrangler hyperdrive create aifw-prod --connection-string="<prod session-pooler URL>"
wrangler hyperdrive create aifw-dev  --connection-string="<dev session-pooler URL>"
```

Put the printed ids into `apps/api/wrangler.jsonc`:

- `REPLACE_WITH_PROD_HYPERDRIVE_ID` → in `env.production`
- `REPLACE_WITH_DEV_HYPERDRIVE_ID` → in **both** the top-level config (used by
  previews) and `env.dev`

(The Hyperdrive id is not a secret — the DB credentials live inside the
Hyperdrive config on Cloudflare. Commit the ids.)

### 3. GitHub — secrets

Repo → Settings → Secrets and variables → Actions → **Secrets**:

| Secret | What |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with **Workers Scripts: Edit**, **Workers Routes: Edit**, **DNS: Edit**, **Account: Read** on the `w3ctech.dev` account/zone |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |
| `CLOUDFLARE_ZONE_ID` | Zone id for `w3ctech.dev` |
| `DATABASE_URL_DEV` | dev Supabase session-pooler URL (used for migrations) |
| `DATABASE_URL_PROD` | prod Supabase session-pooler URL (used for migrations) |

Optional: create GitHub **Environments** `dev` and `production` (Settings →
Environments) and add required reviewers on `production` for a manual approval
gate on the production deploy.

---

## How each deploy works

- **Preview** (`.github/workflows/preview.yml`): on a PR to `dev`, deploys
  `aifw-api-pr-<N>` and `aifw-web-pr-<N>` Workers, attaches the
  `preview-<N>[-api].w3ctech.dev` custom domains (auto-creates DNS via
  `.github/scripts/cf-attach-domain.sh`), and comments the URLs. Previews use
  the dev DB, so no migration runs.
- **Teardown** (`preview-teardown.yml`): on PR close, detaches the domains and
  deletes both Workers (`cf-teardown-preview.sh`).
- **Dev** (`deploy-dev.yml`): on push to `dev`, migrates the dev DB, then
  `wrangler deploy --env dev` for api and OpenNext build + deploy for web.
- **Production** (`deploy-prod.yml`): manual — Actions → **Deploy production** →
  run workflow, type `deploy` to confirm. Migrates the prod DB and deploys
  `--env production`. Checks out `main`.

The api `build` (`wrangler deploy --dry-run`) and the web OpenNext build run in
**CI** on every PR, so a broken bundle fails before any deploy.

---

## Production release flow (no PR into main)

```bash
git checkout main && git pull
git merge --ff-only dev      # or fast-forward to the commit you want to ship
git push origin main         # main allows direct pushes
# then: GitHub → Actions → "Deploy production" → Run workflow → confirm: deploy
```

## Local development

```bash
docker compose up -d db
cp apps/api/.env.example apps/api/.env      # DATABASE_URL = local docker
pnpm db:migrate
pnpm dev                                     # web :3000, worker :3001 (Hyperdrive → local pg)
```

## Notes

- Web is **Next.js on Workers via `@opennextjs/cloudflare`** (not Pages) so the
  GitHub Actions can control the exact `preview-<N>` domain names and teardown.
- `NEXT_PUBLIC_API_URL` is baked at **build time**, so each environment's web is
  built separately with its own API URL.
- Never run a bare `wrangler deploy` for the api — always `--env dev` /
  `--env production` (bare deploy would publish the prod-named Worker against the
  dev DB). Previews use `--name aifw-*-pr-<N>`.
- Supabase free projects pause after ~1 week idle; resume from the dashboard.
