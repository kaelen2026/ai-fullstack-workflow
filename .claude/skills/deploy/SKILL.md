---
name: deploy
description: >-
  Deploy / ship / release this monorepo. Web (Next.js, OpenNext) and API (Hono +
  tRPC + better-auth) both run on Cloudflare Workers; Postgres is Supabase reached
  via Hyperdrive; GitHub Actions orchestrate everything on w3ctech.dev. Use when
  asked to deploy, ship, promote to production, set up a new environment, wire a
  custom domain, or troubleshoot the Cloudflare/Supabase/Actions deploy pipeline.
---

# Deploy

Full topology, branch model, every deploy path, and the gotchas that bite. For
exhaustive setup detail see `DEPLOYMENT.md`; this skill is the operational runbook.

## Topology

```
Browser → Cloudflare Worker (web, Next via @opennextjs/cloudflare)
        → Cloudflare Worker (api, Hono + tRPC + better-auth)
            → Hyperdrive binding → Supabase Postgres
```

Domains live on Cloudflare (`w3ctech.dev` zone). Both apps deploy as Workers with
`custom_domain` routes; Hyperdrive does the DB pooling. `NEXT_PUBLIC_API_URL` is
baked into the web bundle **at build time**, so each env is built separately.

## Branch & environment model

`dev` is the default + protected branch (PR + CI required, squash, linear).
`main` is production and allows **direct pushes** (no PR).

| Env | Trigger | Web | API | DB | Worker names |
| --- | --- | --- | --- | --- | --- |
| preview | open/update PR → `dev` | `preview-<N>.w3ctech.dev` | `preview-<N>-api.w3ctech.dev` | shared **dev** | `aifw-{web,api}-pr-<N>` |
| dev | push to `dev` (PR merge) | `dev.w3ctech.dev` | `dev-api.w3ctech.dev` | **dev** | `ai-fullstack-workflow-{web,api}-dev` |
| production | manual `workflow_dispatch` | `w3ctech.dev` | `api.w3ctech.dev` | **prod** | `ai-fullstack-workflow-{web,api}` |

Closing a PR tears its preview down automatically.

Workflows: `.github/workflows/{ci,preview,preview-teardown,deploy-dev,deploy-prod}.yml`.
Domain attach/teardown helpers: `.github/scripts/cf-*.sh`.

## How to ship a change

1. Branch off `dev`, commit (Conventional Commits; scopes `web|api|db|config|ci|deps|release|repo`), push, open PR **into `dev`**. → preview env auto-deploys, URLs posted on the PR.
2. Merge the PR (squash, delete branch). → `deploy-dev` auto-migrates the dev DB and deploys `dev[-api].w3ctech.dev`; preview torn down.
3. Promote to production (no PR):
   ```bash
   git checkout main && git pull && git merge --ff-only dev && git push origin main
   ```
   Then **GitHub → Actions → "Deploy production" → Run workflow → confirm: `deploy`** (or `gh workflow run deploy-prod.yml --ref main -f confirm=deploy`). It migrates the prod DB and deploys `w3ctech.dev` / `api.w3ctech.dev`.

Keep `dev` and `main` aligned. If a hotfix lands on `main` first, fast-forward it back to `dev` (dev is protected — temporarily disable the ruleset, push, re-enable; see the alignment recipe below).

## Setting up a NEW environment (e.g. a fresh dev/staging)

1. **Supabase**: create the project, copy the **Session pooler** string (IPv4, :5432).
2. **Hyperdrive**: `wrangler hyperdrive create <name> --connection-string="<pooler url>"`; put the printed id into `apps/api/wrangler.jsonc` (the matching `env.*` block, and the top-level binding if it's the dev/preview DB).
3. **Worker secret**: `wrangler secret put BETTER_AUTH_SECRET --env <name>` (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). Google OAuth is optional (`GOOGLE_CLIENT_ID/SECRET`).
4. **GitHub secret** (for the Actions migration step): `DATABASE_URL_<ENV>` = the pooler string.
5. **DNS**: delete any pre-existing `198.18.0.x` placeholder A records for the env's hostnames (see gotcha #1).

## ⚠️ Gotchas (these have all bitten before)

1. **Placeholder DNS → 409.** The zone ships `198.18.0.x` placeholder A records for hostnames. A Worker custom-domain attach **409s** if a record already exists — even with full-perm auth (NOT a token issue). **Delete the placeholder A record first**, then deploy. The CI error is generic ("a request to the Cloudflare API … failed"); the real `409 Conflict` is only in the wrangler debug log.
2. **Duplicate Hyperdrive binding.** Setting a Hyperdrive id in `apps/api/wrangler.jsonc` repeatedly gets done by *adding a second* `HYPERDRIVE` binding instead of replacing the placeholder → wrangler errors "HYPERDRIVE assigned to multiple Hyperdrive Config bindings". Each scope (top-level, `env.dev`, `env.production`) must have **exactly one** `HYPERDRIVE` binding.
3. **CI token needs `Zone → DNS → Edit`.** The Actions deploys create the custom-domain DNS records, so `CLOUDFLARE_API_TOKEN` must include DNS edit (plus Workers Scripts/Routes + Hyperdrive).
4. **Never bare `wrangler deploy` for the api.** Always `--env dev` / `--env production` (a bare deploy publishes the prod-named worker against the dev DB). Previews use `--name aifw-*-pr-<N>`.
5. **`db:push` needs a TTY** (interactive confirm). In scripts/CI use `db:generate` + `db:migrate`.
6. **`NEXT_PUBLIC_API_URL` is build-time.** Build web per env with the right API origin (`https://[dev-]api.w3ctech.dev`); the workflows already do this.

## Deploy locally (bypass Actions, full-perm OAuth)

Useful for first-time bring-up or when Actions is blocked. Requires `wrangler login`.
```bash
# api
pnpm --filter @repo/api exec wrangler deploy --env <dev|production>
# web (built per env)
NEXT_PUBLIC_API_URL=https://<dev-api|api>.w3ctech.dev pnpm --filter @repo/web exec opennextjs-cloudflare build
pnpm --filter @repo/web exec wrangler deploy --env <dev|production>
```
Migrations run separately: `DATABASE_URL=<pooler> pnpm --filter @repo/api exec drizzle-kit migrate`.

## Verify a deploy

```bash
curl -s https://<api-host>/health                 # {"status":"healthy"}
curl -s https://<api-host>/trpc/health             # {"result":{"data":{"status":"ok"}}}
curl -s -o /dev/null -w '%{http_code}' https://<web-host>   # 200
curl -s -o /dev/null -w '%{http_code}' https://<api-host>/api/auth/ok   # 200 (better-auth up)
```
Public `dig` may show stale `198.18.0.x` right after a deploy (DNS cache) while the request still succeeds via Cloudflare's edge — that's fine.

## Align `dev` ⇄ `main` (dev is protected)

```bash
RS=$(gh api repos/<owner>/<repo>/rules/branches/dev -q '.[0].ruleset_id')
gh api repos/<owner>/<repo>/rulesets/$RS > /tmp/rs.json   # then PUT enforcement:disabled
git push origin origin/main:refs/heads/dev               # (or dev:main) — fast-forward
# PUT enforcement:active to restore
```
Reference ids: Account/Zone live in GitHub secrets; Hyperdrive ids are in `apps/api/wrangler.jsonc` (`082f…` prod, `125c…` dev).
