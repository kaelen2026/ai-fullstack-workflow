'use client'

import { Loader2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn, signUp } from '@/lib/auth-client'

type Mode = 'signin' | 'signup'

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error } =
      mode === 'signup'
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password })
    setPending(false)
    // On success the useSession hook re-renders the parent into the app.
    if (error) setError(error.message ?? 'Something went wrong.')
  }

  async function onGoogle() {
    setError(null)
    const { error } = await signIn.social({
      provider: 'google',
      callbackURL: window.location.origin,
    })
    if (error) setError(error.message ?? 'Google sign-in is unavailable.')
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border p-6 shadow-sm">
      <div className="space-y-1.5 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">
          {mode === 'signup' ? 'Create an account' : 'Welcome back'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'signup'
            ? 'Sign up to start tracking your todos.'
            : 'Sign in to see your todos.'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === 'signup' && (
          <Input
            type="text"
            placeholder="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {mode === 'signup' ? 'Sign up' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
        Continue with Google
      </Button>

      <p className="text-center text-muted-foreground text-sm">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setError(null)
            setMode(mode === 'signup' ? 'signin' : 'signup')
          }}
        >
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  )
}
