import { describe, expect, it } from 'vitest'
import { createTodoInput, todoIdInput } from './todos.router'

describe('createTodoInput', () => {
  it('accepts a normal title', () => {
    expect(createTodoInput.parse({ title: 'Buy milk' })).toEqual({ title: 'Buy milk' })
  })

  it('trims surrounding whitespace', () => {
    expect(createTodoInput.parse({ title: '  Buy milk  ' })).toEqual({ title: 'Buy milk' })
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(createTodoInput.safeParse({ title: '' }).success).toBe(false)
    expect(createTodoInput.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('rejects a title longer than 256 chars', () => {
    expect(createTodoInput.safeParse({ title: 'a'.repeat(256) }).success).toBe(true)
    expect(createTodoInput.safeParse({ title: 'a'.repeat(257) }).success).toBe(false)
  })

  it('rejects a missing or non-string title', () => {
    expect(createTodoInput.safeParse({}).success).toBe(false)
    expect(createTodoInput.safeParse({ title: 123 }).success).toBe(false)
  })
})

describe('todoIdInput', () => {
  it('accepts a positive integer id', () => {
    expect(todoIdInput.parse({ id: 1 })).toEqual({ id: 1 })
  })

  it('rejects zero, negatives, and non-integers', () => {
    expect(todoIdInput.safeParse({ id: 0 }).success).toBe(false)
    expect(todoIdInput.safeParse({ id: -3 }).success).toBe(false)
    expect(todoIdInput.safeParse({ id: 1.5 }).success).toBe(false)
  })

  it('rejects a missing or non-numeric id', () => {
    expect(todoIdInput.safeParse({}).success).toBe(false)
    expect(todoIdInput.safeParse({ id: '1' }).success).toBe(false)
  })
})
