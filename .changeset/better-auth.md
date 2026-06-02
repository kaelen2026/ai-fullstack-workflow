---
"@repo/api": minor
"@repo/web": minor
---

Add authentication with better-auth (email/password + Google OAuth). The API
serves better-auth at `/api/auth/*` with a per-request instance over the
Drizzle/Postgres adapter, adds `user`/`session`/`account`/`verification` tables,
and exposes `protectedProcedure`. Todos are now scoped per user. The web app
gains sign-up/in/out UI (`better-auth/react`) and gates todos behind a session.
Cross-site session cookies (`SameSite=None; Secure`) are used in production.
