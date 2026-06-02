import { createAuthClient } from 'better-auth/react'

// The api origin; better-auth appends its basePath (`/api/auth`). Baked at
// build time, like NEXT_PUBLIC_API_URL for the tRPC client.
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const authClient = createAuthClient({
  baseURL,
  // Send/receive the cross-site session cookie.
  fetchOptions: { credentials: 'include' },
})

export const { signIn, signUp, signOut, useSession } = authClient
