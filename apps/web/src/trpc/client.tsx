'use client'

import type { AppRouter } from '@repo/api/trpc'
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import { makeQueryClient } from './query-client'

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a fresh client.
    return makeQueryClient()
  }
  // Browser: reuse one client across renders.
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  return `${base}/trpc`
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getApiUrl(),
          // Send the better-auth session cookie on cross-origin requests.
          fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
