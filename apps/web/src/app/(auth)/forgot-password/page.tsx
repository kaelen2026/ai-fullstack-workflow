'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from '@/lib/auth-client'

const emailSchema = z.string().trim().min(1, 'Email is required.').email('Enter a valid email.')

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email.')
      return
    }

    setPending(true)
    // The link lands the user back on this app's /reset-password page (with the
    // token appended) after the API validates it.
    const { error } = await requestPasswordReset({
      email: parsed.data,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setPending(false)
    // Always confirm — don't reveal whether an account exists for this email.
    if (error) setError(error.message ?? 'Something went wrong.')
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-xl border p-6 text-center shadow-sm">
        <h1 className="font-semibold text-2xl tracking-tight">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          If an account exists for <span className="text-foreground">{email}</span>, we've sent a
          link to reset your password.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border p-6 shadow-sm">
      <div className="space-y-1.5 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">Forgot password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
