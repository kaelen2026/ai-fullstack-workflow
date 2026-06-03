'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn, signUp } from '@/lib/auth-client'

type Mode = 'signin' | 'signup'

// Mirror the better-auth constraints: a valid email and an 8+ char password,
// plus a name when signing up. Trim so leading/trailing whitespace can't pass.
const baseFields = {
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
}
const signinSchema = z.object(baseFields)
const signupSchema = z.object({
  ...baseFields,
  name: z.string().trim().min(1, 'Name is required.').max(128),
})

type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>

// First zod message per field, ready to render under each input.
function toFieldErrors(err: z.ZodError): FieldErrors {
  const flat = err.flatten().fieldErrors as Record<string, string[] | undefined>
  return { name: flat.name?.[0], email: flat.email?.[0], password: flat.password?.[0] }
}

export function AuthForm({ defaultMode = 'signin' }: { defaultMode?: Mode } = {}) {
  const [mode] = useState<Mode>(defaultMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (mode === 'signup') {
      const parsed = signupSchema.safeParse({ name, email, password })
      if (!parsed.success) return setFieldErrors(toFieldErrors(parsed.error))
      setPending(true)
      const { error } = await signUp.email(parsed.data)
      setPending(false)
      if (error) setError(error.message ?? 'Something went wrong.')
      return
    }

    const parsed = signinSchema.safeParse({ email, password })
    if (!parsed.success) return setFieldErrors(toFieldErrors(parsed.error))
    setPending(true)
    const { error } = await signIn.email(parsed.data)
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
          <div className="space-y-1.5">
            <Input
              type="text"
              placeholder="Name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && <p className="text-destructive text-sm">{fieldErrors.name}</p>}
          </div>
        )}
        <div className="space-y-1.5">
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <p className="text-destructive text-sm">{fieldErrors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Input
            type="password"
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.password}
          />
          {fieldErrors.password && (
            <p className="text-destructive text-sm">{fieldErrors.password}</p>
          )}
          {mode === 'signin' && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

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
        <Link
          href={mode === 'signup' ? '/login' : '/register'}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </div>
  )
}
