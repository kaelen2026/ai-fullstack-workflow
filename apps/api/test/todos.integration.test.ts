import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../src/db/schema'
import { createTestCaller } from './helpers/caller'
import { createTestDb, seedUser, truncateAll } from './helpers/db'

const { db, close } = createTestDb()

afterAll(async () => {
  await close()
})

beforeEach(async () => {
  await truncateAll(db)
})

// Small gap so two creates get distinct `created_at` timestamps for ordering.
const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

describe('todos router (integration)', () => {
  it('rejects unauthenticated callers', async () => {
    const caller = createTestCaller({ db, user: null })
    await expect(caller.todos.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(caller.todos.create({ title: 'x' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('creates and lists todos newest-first', async () => {
    const user = await seedUser(db)
    const caller = createTestCaller({ db, user: { id: user.id } })

    await caller.todos.create({ title: 'first' })
    await tick()
    await caller.todos.create({ title: 'second' })

    const list = await caller.todos.list()
    expect(list).toHaveLength(2)
    expect(list.map((t) => t.title)).toEqual(['second', 'first'])
    expect(list.every((t) => t.completed === false)).toBe(true)
  })

  it('toggles completed back and forth', async () => {
    const user = await seedUser(db)
    const caller = createTestCaller({ db, user: { id: user.id } })

    const todo = await caller.todos.create({ title: 'task' })
    expect(todo.completed).toBe(false)

    expect((await caller.todos.toggle({ id: todo.id })).completed).toBe(true)
    expect((await caller.todos.toggle({ id: todo.id })).completed).toBe(false)
  })

  it('deletes a todo', async () => {
    const user = await seedUser(db)
    const caller = createTestCaller({ db, user: { id: user.id } })

    const todo = await caller.todos.create({ title: 'temp' })
    expect(await caller.todos.delete({ id: todo.id })).toEqual({ id: todo.id })
    expect(await caller.todos.list()).toHaveLength(0)
  })

  it('returns NOT_FOUND when toggling a missing todo', async () => {
    const user = await seedUser(db)
    const caller = createTestCaller({ db, user: { id: user.id } })
    await expect(caller.todos.toggle({ id: 999_999 })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('scopes todos per user', async () => {
    const alice = await seedUser(db, { email: 'alice@example.com' })
    const bob = await seedUser(db, { email: 'bob@example.com' })
    const aliceCaller = createTestCaller({ db, user: { id: alice.id } })
    const bobCaller = createTestCaller({ db, user: { id: bob.id } })

    const todo = await aliceCaller.todos.create({ title: "alice's secret" })

    // Bob can neither see nor toggle Alice's todo…
    expect(await bobCaller.todos.list()).toHaveLength(0)
    await expect(bobCaller.todos.toggle({ id: todo.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })

    // …and deleting under Bob's scope is a no-op against Alice's row.
    await bobCaller.todos.delete({ id: todo.id })
    expect(await aliceCaller.todos.list()).toHaveLength(1)
  })

  it('cascade-deletes todos when the owning user is removed', async () => {
    const user = await seedUser(db)
    const caller = createTestCaller({ db, user: { id: user.id } })
    await caller.todos.create({ title: 'orphan-to-be' })

    await db.delete(schema.user).where(eq(schema.user.id, user.id))

    expect(await db.select().from(schema.todos)).toHaveLength(0)
  })
})
