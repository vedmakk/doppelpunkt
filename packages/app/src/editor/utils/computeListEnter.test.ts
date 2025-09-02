import { describe, it, expect } from 'bun:test'

import { VISUAL_INDENT_CHAR } from './visualIndent'

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

  it('continues unordered list when item is not empty with visual indent', () => {
    const value = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
    const caret = value.length

    const result = computeListEnter({
      value,
      selectionStart: caret,
      selectionEnd: caret,
      shiftKey: false,
    })

    expect(result).not.toBeUndefined()

    const { newValue, newCursor } = result!

    expect(newValue).toBe(`${value}\n- `)
    expect(newCursor).toBe(caret + 3)
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

  it('inserts soft line break with Shift+Enter with visual indent', () => {
    const value = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
    const caret = value.length

    const result = computeListEnter({
      value,
      selectionStart: caret,
      selectionEnd: caret,
      shiftKey: true,
    })

    expect(result).not.toBeUndefined()

    const { newValue, newCursor } = result!

    expect(newValue).toBe(`${value}\n  `)
    expect(newCursor).toBe(caret + 3)
  })

  // We intentionally don't support this behaviour:
  // Because how far should you look back to find the list item?
  // The user can always use the backspace key to remove the spaces and
  // easily bail out.
  it.skip('exits list when soft line break was used before and item is empty', () => {
    const value = '- item\n  '
    const caret = value.length

    const result = computeListEnter({
      value,
      selectionStart: caret,
      selectionEnd: caret,
      shiftKey: false,
    })

    expect(result).not.toBeUndefined()

    const { newValue } = result!

    expect(newValue).toBe('- item\n\n')
  })

  describe('cursor before list marker', () => {
    it('inserts plain newline when cursor is at the very beginning of list item', () => {
      const value = '- item'
      const caret = 0 // cursor at the very beginning

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('\n- item')
      expect(newCursor).toBe(1) // position after inserted newline
    })

    it('inserts plain newline when cursor is before the dash', () => {
      const value = '- item'
      const caret = 0 // cursor before the dash

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('\n- item')
      expect(newCursor).toBe(1)
    })

    it('inserts plain newline when cursor is on the dash', () => {
      const value = '- item'
      const caret = 1 // cursor on the dash

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('-\n item')
      expect(newCursor).toBe(2)
    })

    it('continues list when cursor is at the beginning of content', () => {
      const value = '- item'
      const caret = 2 // cursor after the prefix, at the beginning of "item"

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('- \n- item')
      expect(newCursor).toBe(5) // position after "- \n- "
    })

    it('continues list when cursor is within content (splits at cursor)', () => {
      const value = '- item'
      const caret = 3 // cursor within the content "item"

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('- i\n- tem')
      expect(newCursor).toBe(6) // position after "- i\n- "
    })

    it('handles ordered lists with cursor before number', () => {
      const value = '1. item'
      const caret = 0 // cursor before the number

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('\n1. item')
      expect(newCursor).toBe(1)
    })

    it('handles ordered lists with cursor on the number', () => {
      const value = '1. item'
      const caret = 1 // cursor on the number

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('1\n. item')
      expect(newCursor).toBe(2)
    })

    it('handles indented lists with cursor before indent', () => {
      const value = '  - item'
      const caret = 0 // cursor before the indent

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('\n  - item')
      expect(newCursor).toBe(1)
    })

    it('handles indented lists with cursor within indent', () => {
      const value = '  - item'
      const caret = 1 // cursor within the indent

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: false,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe(' \n - item')
      expect(newCursor).toBe(2)
    })

    it('works with Shift+Enter when cursor is before list marker', () => {
      const value = '- item'
      const caret = 0 // cursor before the dash

      const result = computeListEnter({
        value,
        selectionStart: caret,
        selectionEnd: caret,
        shiftKey: true,
      })

      expect(result).not.toBeUndefined()

      const { newValue, newCursor } = result!

      expect(newValue).toBe('\n- item')
      expect(newCursor).toBe(1)
    })
  })
})
