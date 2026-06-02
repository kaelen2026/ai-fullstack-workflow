import { ArrowRight, Check, ListChecks, Lock, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Lock,
    title: 'Yours alone',
    description: 'Every list is scoped to your account. No sharing, no leaks, no exceptions.',
  },
  {
    icon: Zap,
    title: 'Instant, end to end',
    description: 'Type-safe from database to button. Changes land the moment you make them.',
  },
  {
    icon: ListChecks,
    title: 'Sign in once',
    description: 'Email or Google. One tap and your todos are exactly where you left them.',
  },
]

const sampleTodos = [
  { label: 'Review the design system', done: true },
  { label: 'Ship the landing page', done: true },
  { label: 'Plan next week', done: false },
]

export function Landing() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Frosted sticky header — iOS navigation bar */}
      <header className="sticky top-0 z-50 border-border border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Check className="size-4" />
            </span>
            Todos
          </Link>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        {/* Hero */}
        <section className="flex flex-col items-center pt-24 pb-16 text-center sm:pt-32">
          <p className="mb-5 rounded-full border border-border bg-secondary px-3 py-1 font-medium text-muted-foreground text-xs">
            Calm, private task tracking
          </p>
          <h1 className="max-w-2xl text-balance font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            The to-do list that stays out of your way.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground leading-relaxed">
            A type-safe todo app that&rsquo;s quiet until you touch it. Sign in once, and your list
            is yours alone — fast, focused, and entirely private.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-7 active:scale-[0.98]">
              <Link href="/login">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full px-6">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          {/* Product preview — the iOS grouped-list pattern in miniature */}
          <div className="mt-16 w-full max-w-md text-left">
            <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-border border-b bg-secondary/60 px-5 py-3">
                <span className="font-semibold text-sm tracking-tight">Today</span>
                <span className="text-muted-foreground text-xs">{sampleTodos.length} items</span>
              </div>
              <ul>
                {sampleTodos.map((todo, i) => (
                  <li
                    key={todo.label}
                    className={`flex items-center gap-3 px-5 py-3.5 ${
                      i < sampleTodos.length - 1 ? 'border-border border-b' : ''
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        todo.done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40'
                      }`}
                    >
                      {todo.done && <Check className="size-3" />}
                    </span>
                    <span
                      className={`text-sm ${todo.done ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {todo.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features — iOS grouped list */}
        <section className="pb-24">
          <h2 className="mb-6 text-center font-semibold text-2xl tracking-tight">
            Everything you need, nothing you don&rsquo;t.
          </h2>
          <div className="mx-auto max-w-2xl overflow-hidden rounded-[18px] border border-border bg-card">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex items-start gap-4 px-5 py-5 ${
                  i < features.length - 1 ? 'border-border border-b' : ''
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <feature.icon className="size-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-medium tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-muted-foreground text-sm sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Todos</span>
          <span className="font-mono text-xs">Next.js · Hono · tRPC · Drizzle</span>
        </div>
      </footer>
    </div>
  )
}
