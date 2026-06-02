import type { Metadata } from 'next'
import { TRPCReactProvider } from '@/trpc/client'
import './globals.css'

export const metadata: Metadata = {
  title: 'Todos — calm, private task tracking',
  description:
    'A type-safe, per-user todo app. Sign in once and your list is yours alone. Built on Next.js, Hono, tRPC, and Drizzle.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}
