# test/test-pyramid — Add a test pyramid

**Date:** 2026-jun-02
**Branch:** `test/test-pyramid`
**Worktree:** `../ai-fullstack-workflow-test-test-pyramid` (off `origin/dev`)

## Goal

The repo has no test runner ("There is no test runner configured yet"), so regressions in the tRPC contract, DB queries, or UI go uncaught until deploy. Introduce a full **test pyramid** — a broad base of fast unit tests, a middle band of integration tests against real infrastructure, and a thin top of end-to-end browser tests — wired into Turbo and CI so it runs on every PR to `dev`.

## Decisions

- **Full pyramid** — all three layers.
- **Integration tests hit real Postgres** (the existing Docker `db` service), against a dedicated `app_test` database.
- **CI `Test` job** wired now; **E2E** as a separate job.
- Tooling: **Vitest 3** (unit + integration), **@testing-library/react + jsdom** (web component integration), **Playwright** (E2E).

```
        ╱  E2E  ╲          Playwright — 1 spec: signup → create → toggle → delete → signout
      ╱ integration ╲      tRPC procedures vs real Postgres; Todos component vs mocked tRPC
    ╱      unit        ╲    zod input schemas; cn() class-merge util
```

## Scope

### Layer 1 — Unit (no I/O)
- Refactor `apps/api/src/trpc/routers/todos.ts` to export `createTodoInput` / `todoIdInput` zod schemas and reuse them in the procedures (behaviour unchanged).
- `apps/api/src/trpc/routers/todos.schema.test.ts` — schema parse/validation cases.
- `apps/web/src/lib/utils.test.ts` — `cn()` class merge/dedupe/falsy.

### Layer 2 — Integration (real infra)
- API: `apps/api/test/helpers/{db,caller}.ts`, `apps/api/test/global-setup.ts` (create `app_test` + run drizzle migrations), `apps/api/test/todos.integration.test.ts` (CRUD, per-user scoping, `UNAUTHORIZED`, cascade delete) via `appRouter.createCaller`.
- Web: `apps/web/test/setup.ts` (jest-dom), `apps/web/src/components/todos.test.tsx` (render `Todos` in a real `QueryClientProvider` with `useTRPC` mocked).

### Layer 3 — E2E (real browser)
- `playwright.config.ts` (root), `e2e/global-setup.ts` (migrate dev `app` DB), `e2e/todos.spec.ts` (signup → create → toggle → delete → signout, per-run unique email).

### Wiring
- Catalog deps in `pnpm-workspace.yaml`: vitest, @vitejs/plugin-react, jsdom, @testing-library/{react,dom,user-event,jest-dom}, @playwright/test.
- `vitest.config.ts` in api (unit + integration projects) and web (jsdom).
- `test` / `test:watch` scripts per package; root `test` (→ turbo) + `test:e2e`.
- `turbo.json` `test` task; tsconfig excludes for test files; Biome overrides for test/e2e globs.
- `.github/workflows/ci.yml`: `Test` job (postgres `app_test`) + `E2E` job (postgres `app`, playwright install, report artifact).

## Verification

1. `docker compose up -d db`
2. `pnpm install` && `pnpm exec playwright install chromium`
3. `pnpm --filter @repo/api test` · `pnpm --filter @repo/web test` · `pnpm test`
4. `pnpm test:e2e`
5. `pnpm lint` · `pnpm check-types` · `pnpm build`

## Out of scope

Coverage thresholds/reporters, broader auth E2E, mutation/perf testing.
