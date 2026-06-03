# feat/auth-route-group

**Goal:** Group the auth screens under a Next.js `(auth)` route group and validate auth inputs with zod.

## Scope

- `apps/web/src/app/(auth)/layout.tsx` — shared chrome (header + centered main) and the "redirect to `/` once authenticated" logic, lifted out of the old login page.
- `apps/web/src/app/(auth)/login/page.tsx`, `(auth)/register/page.tsx` — thin pages rendering `<AuthForm defaultMode=…>` (`/login`, `/register`).
- Remove `apps/web/src/app/login/page.tsx` (relocated into the group; both resolved to `/login`).
- `apps/web/src/components/auth-form.tsx` — `defaultMode` prop; footer toggle is now a real `<Link>` between `/login` and `/register`; inputs validated with zod (email/password, + name on signup) showing per-field errors.
- Add `zod` to `@repo/web` (catalog).

## Out of scope

Forgot-password flow (its own PR) and the `@repo/db` extraction (its own PR).

## Verification

`pnpm check-types`, `pnpm lint`.
