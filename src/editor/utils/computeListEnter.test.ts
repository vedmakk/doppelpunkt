import { describe, it, expect } from 'bun:test'

import { computeListEnter } from './computeListEnter'

describe('computeListEnter', () => {
  it('returns undefined when current line is not a list item', () => {
    const result = computeListEnter({
      value: 'Hello world',
      selectionStart: 5,
      selectionEnd: 5,
      shiftKey: false,
    })

    expect(result).toBeUndefined()
  })

  it('continues unordered list when item is not empty', () => {
    const value = '- item'
    const caret = value.length // 6

    const result = computeListEnter({
      value,
      selectionStart: caret,
      selectionEnd: caret,
      shiftKey: false,
    })

    expect(result).not.toBeUndefined()

    const { newValue, newCursor } = result!

    expect(newValue).toBe('- item\n- ')
    expect(newCursor).toBe(caret + 3) // "\n- " is 3 characters
  })

  it('exits list when item is empty', () => {
    const value = '- '
    const caret = value.length // 2

    const result = computeListEnter({
      value,
      selectionStart: caret,
      selectionEnd: caret,
      shiftKey: false,
    })

    expect(result).not.toBeUndefined()

    const { newValue, newCursor } = result!

    expect(newValue).toBe('\n')
    expect(newCursor).toBe(1)
  })

  it('inserts soft line break with Shift+Enter', () => {
    const value = '- item'
    const caret = value.length // 6

    const result = computeListEnter({
      value,
      selectionStart: caret,
      selectionEnd: caret,
      shiftKey: true,
    })

    expect(result).not.toBeUndefined()

    const { newValue, newCursor } = result!

    // prefix length is 2 ("- ") => two spaces after newline
    expect(newValue).toBe('- item\n  ')
    expect(newCursor).toBe(caret + 3)
  })
})
