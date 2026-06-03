import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Bindings } from '../bindings'
import { type Database, schema } from './db'
import { resetPasswordEmail, sendEmail } from './email'

/**
 * Build a better-auth instance for a single Worker request.
 *
 * Like the Drizzle client, there is no module-scope env on Workers, so auth is
 * constructed per request from `c.env`. It reuses the request's Drizzle client
 * through the drizzle adapter.
 */
export function createAuth(db: Database, env: Bindings) {
  // Web (Vercel) and API (Workers) live on different sites in production, so
  // the session cookie must be cross-site capable (SameSite=None; Secure).
  // Locally both run on http://localhost (same site), where Lax works and
  // Secure cookies would be dropped over http.
  const useSecureCookies = env.BETTER_AUTH_URL?.startsWith('https://') ?? false

  const socialProviders =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    trustedOrigins: [env.CORS_ORIGIN],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      // `url` is the API reset link; clicking it validates the token and
      // redirects to the web `redirectTo` (the /reset-password page) with the
      // token appended. With no RESEND_API_KEY, sendEmail logs it (dev).
      sendResetPassword: async ({ user, url }) => {
        // Dev convenience: without a Resend key, print the link so the flow is
        // testable from the console (sendEmail then just logs that it skipped).
        if (!env.RESEND_API_KEY) {
          console.log(`[auth] Password reset link for ${user.email}:\n${url}`)
        }
        await sendEmail(env, { to: user.email, ...resetPasswordEmail(url) })
      },
    },
    socialProviders,
    advanced: useSecureCookies
      ? {
          useSecureCookies: true,
          defaultCookieAttributes: { sameSite: 'none', secure: true },
        }
      : undefined,
  })
}

export type Auth = ReturnType<typeof createAuth>
