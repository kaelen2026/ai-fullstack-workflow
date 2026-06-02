'use client'

import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AuthForm } from '@/components/auth-form'
import { useSession } from '@/lib/auth-client'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Once authenticated (email/password or Google), send the user to their todos.
  useEffect(() => {
    if (session) router.replace('/')
  }, [session, router])

  if (isPending || session) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Check className="size-4" />
            </span>
            Todos
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <AuthForm />
      </main>
    </div>
  )
}
