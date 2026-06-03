# feat/password-reset-resend

**Goal:** Add a forgot/reset-password flow backed by better-auth + Resend.

**Base:** stacked on `feat/auth-route-group`.

## Scope

- `apps/api/src/core/email.ts` — `sendEmail()` via Resend's REST API (fetch, no SDK → Workers-safe) + an on-brand `resetPasswordEmail()` template. With no `RESEND_API_KEY`, it logs instead of sending (dev).
- `apps/api/src/core/auth.ts` — `emailAndPassword.sendResetPassword` emails the reset link (and logs it in dev when no key).
- `apps/api/src/bindings.ts` — `RESEND_API_KEY` (secret) + `EMAIL_FROM` (var); `wrangler.jsonc` sets `EMAIL_FROM` per env; `.dev.vars.example` documents the key.
- `apps/web/src/app/(auth)/forgot-password/page.tsx` — request a reset link (zod-validated email; neutral confirmation).
- `apps/web/src/app/(auth)/reset-password/page.tsx` — set a new password from `?token=` (Suspense-wrapped); "link expired" state.
- `apps/web/src/lib/auth-client.ts` — export `requestPasswordReset` / `resetPassword`.
- `apps/web/src/components/auth-form.tsx` — "Forgot password?" link in sign-in mode.

## Out of scope

The `@repo/db` extraction (its own PR).

## Deploy note

`RESEND_API_KEY` is a Worker secret — `wrangler secret put RESEND_API_KEY --env {dev,production}`. `EMAIL_FROM` defaults to Resend's shared `onboarding@resend.dev` sender.

## Verification

`pnpm check-types`, `pnpm lint`, api Worker bundle (`pnpm --filter @repo/api build`).
