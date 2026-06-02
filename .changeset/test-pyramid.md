---
"@repo/api": minor
"@repo/web": minor
---

Add a test pyramid: Vitest unit + integration tests (tRPC procedures against a
real Postgres `app_test` DB; the Todos component via React Testing Library) and a
Playwright end-to-end journey (signup → create → toggle → delete → signout). Wired
into Turbo (`pnpm test`) and CI as `Test` and `E2E` jobs.
