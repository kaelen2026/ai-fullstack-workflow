'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

export default function Home() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')

  const todosQuery = useQuery(trpc.todos.list.queryOptions())

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })

  const createTodo = useMutation(
    trpc.todos.create.mutationOptions({
      onSuccess: () => {
        setTitle('')
        invalidate()
      },
    }),
  )
  const toggleTodo = useMutation(trpc.todos.toggle.mutationOptions({ onSuccess: invalidate }))
  const deleteTodo = useMutation(trpc.todos.delete.mutationOptions({ onSuccess: invalidate }))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    createTodo.mutate({ title: value })
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">Todos</h1>
        <p className="text-muted-foreground text-sm">
          Next.js 16 + Hono + tRPC + Drizzle, end to end type-safe.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button type="submit" disabled={createTodo.isPending}>
          {createTodo.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </form>

      <section className="space-y-2">
        {todosQuery.isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {todosQuery.isError && (
          <p className="text-destructive text-sm">
            Failed to load todos. Is the API running on <code>:3001</code>?
          </p>
        )}
        {todosQuery.data?.length === 0 && (
          <p className="text-muted-foreground text-sm">Nothing yet — add your first todo above.</p>
        )}

        <ul className="divide-y rounded-md border">
          {todosQuery.data?.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 px-3 py-2.5">
              <Button
                variant="outline"
                size="icon"
                className={cn('size-6', todo.completed && 'bg-primary text-primary-foreground')}
                onClick={() => toggleTodo.mutate({ id: todo.id })}
                aria-label="Toggle todo"
              >
                {todo.completed && <Check className="size-3.5" />}
              </Button>
              <span
                className={cn(
                  'flex-1 text-sm',
                  todo.completed && 'text-muted-foreground line-through',
                )}
              >
                {todo.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteTodo.mutate({ id: todo.id })}
                aria-label="Delete todo"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
