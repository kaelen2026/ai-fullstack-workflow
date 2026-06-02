import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 0 as unknown as string, 'b')).toBe('a b')
  })

  it('applies conditional (object) classes', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  it('dedupes conflicting Tailwind utilities, keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('returns an empty string with no input', () => {
    expect(cn()).toBe('')
  })
})
