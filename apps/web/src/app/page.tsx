'use client'

import { Loader2 } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'
import { Todos } from '@/components/todos'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'

export default function Home() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 py-16">
        <AuthForm />
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-semibold text-3xl tracking-tight">Todos</h1>
          <p className="text-muted-foreground text-sm">
            Signed in as {session.user.name || session.user.email}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </header>

      <Todos />
    </main>
  )
}
