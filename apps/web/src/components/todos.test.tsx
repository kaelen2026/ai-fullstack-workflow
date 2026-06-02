import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Todos } from './todos'

// Hoisted so the (hoisted) vi.mock factory can reference them.
const { listFn, createFn, toggleFn, deleteFn } = vi.hoisted(() => ({
  listFn: vi.fn(),
  createFn: vi.fn(),
  toggleFn: vi.fn(),
  deleteFn: vi.fn(),
}))

// Replace the tRPC hook with controllable fakes. `mutationOptions` preserves the
// component's `onSuccess` (so input-clear + invalidate still run) and swaps in a
// fake `mutationFn`; `queryOptions` returns a fake `queryFn`.
vi.mock('@/trpc/client', () => ({
  useTRPC: () => ({
    todos: {
      list: {
        queryOptions: () => ({ queryKey: ['todos', 'list'], queryFn: () => listFn() }),
        queryKey: () => ['todos', 'list'],
      },
      create: { mutationOptions: (opts: object) => ({ ...opts, mutationFn: createFn }) },
      toggle: { mutationOptions: (opts: object) => ({ ...opts, mutationFn: toggleFn }) },
      delete: { mutationOptions: (opts: object) => ({ ...opts, mutationFn: deleteFn }) },
    },
  }),
}))

function renderTodos() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  listFn.mockReset()
  createFn.mockReset()
  toggleFn.mockReset()
  deleteFn.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('<Todos />', () => {
  it('renders todos returned by the query', async () => {
    listFn.mockResolvedValue([
      { id: 1, title: 'Write tests', completed: false },
      { id: 2, title: 'Ship it', completed: true },
    ])
    renderTodos()

    expect(await screen.findByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('Ship it')).toBeInTheDocument()
  })

  it('shows the empty state when there are no todos', async () => {
    listFn.mockResolvedValue([])
    renderTodos()

    expect(await screen.findByText(/nothing yet/i)).toBeInTheDocument()
  })

  it('shows an error message when the query fails', async () => {
    listFn.mockRejectedValue(new Error('boom'))
    renderTodos()

    expect(await screen.findByText(/failed to load todos/i)).toBeInTheDocument()
  })

  it('creates a todo and clears the input', async () => {
    listFn.mockResolvedValue([])
    createFn.mockResolvedValue({ id: 3, title: 'New task', completed: false })
    const user = userEvent.setup()
    renderTodos()
    await screen.findByText(/nothing yet/i)

    const input = screen.getByPlaceholderText('What needs doing?')
    await user.type(input, 'New task')
    await user.click(screen.getByRole('button', { name: /add/i }))

    // React Query v5 passes a context object as a 2nd arg — only assert the variables.
    await waitFor(() =>
      expect(createFn).toHaveBeenCalledWith({ title: 'New task' }, expect.anything()),
    )
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('does not submit an empty/whitespace title', async () => {
    listFn.mockResolvedValue([])
    const user = userEvent.setup()
    renderTodos()
    await screen.findByText(/nothing yet/i)

    await user.type(screen.getByPlaceholderText('What needs doing?'), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(createFn).not.toHaveBeenCalled()
  })

  it('toggles a todo by id', async () => {
    listFn.mockResolvedValue([{ id: 7, title: 'Toggle me', completed: false }])
    toggleFn.mockResolvedValue({ id: 7, title: 'Toggle me', completed: true })
    const user = userEvent.setup()
    renderTodos()
    await screen.findByText('Toggle me')

    await user.click(screen.getByRole('button', { name: /toggle todo/i }))
    await waitFor(() => expect(toggleFn).toHaveBeenCalledWith({ id: 7 }, expect.anything()))
  })

  it('deletes a todo by id', async () => {
    listFn.mockResolvedValue([{ id: 9, title: 'Delete me', completed: false }])
    deleteFn.mockResolvedValue({ id: 9 })
    const user = userEvent.setup()
    renderTodos()
    await screen.findByText('Delete me')

    await user.click(screen.getByRole('button', { name: /delete todo/i }))
    await waitFor(() => expect(deleteFn).toHaveBeenCalledWith({ id: 9 }, expect.anything()))
  })
})
