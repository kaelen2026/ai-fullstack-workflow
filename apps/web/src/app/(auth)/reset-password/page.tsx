'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, Suspense, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/lib/auth-client'

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.').max(128)

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  // better-auth appends the token to redirectTo; ?error=... on an invalid link.
  const token = params.get('token')
  const linkError = params.get('error')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid password.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!token) {
      setError('This reset link is invalid or has expired.')
      return
    }

    setPending(true)
    const { error } = await resetPassword({ newPassword: parsed.data, token })
    setPending(false)
    if (error) setError(error.message ?? 'Something went wrong.')
    else router.replace('/login')
  }

  if (linkError || !token) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-xl border p-6 text-center shadow-sm">
        <h1 className="font-semibold text-2xl tracking-tight">Link expired</h1>
        <p className="text-muted-foreground text-sm">
          This password reset link is invalid or has expired. Request a new one.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border p-6 shadow-sm">
      <div className="space-y-1.5 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground text-sm">Choose a password to finish resetting.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={!!error}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Reset password
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="size-5 animate-spin text-muted-foreground" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
