import { describe, it, expect } from 'bun:test'

import {
  injectVisualIndents,
  stripVisualIndents,
  VISUAL_INDENT_CHAR,
} from './visualIndent'

describe('visualIndent utilities', () => {
  describe('stripVisualIndents', () => {
    it('removes visual indent characters that follow a newline', () => {
      const input = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      // Place cursor at the end of the string for this assertion
      const { sanitizedValue, sanitizedCursorPos } = stripVisualIndents(
        input,
        input.length,
      )

      // Expect the newline + indent chars to be removed
      expect(sanitizedValue).toBe('- itemcontinued')

      // Cursor should now be at the end of the sanitized string
      expect(sanitizedCursorPos).toBe(sanitizedValue.length)
    })

    it('is a no-op when no visual indents are present', () => {
      const input = 'Plain text without indents'
      const result = stripVisualIndents(input, 5)
      expect(result).toEqual({ sanitizedValue: input, sanitizedCursorPos: 5 })
    })
  })

  describe('injectVisualIndents', () => {
    it('returns the original text when no list item is present', () => {
      const raw = 'Just a regular paragraph that should stay untouched.'
      const caret = 0
      const { injectedValue, injectedCursorPos } = injectVisualIndents(
        raw,
        caret,
        80,
      )
      expect(injectedValue).toBe(raw)
      expect(injectedCursorPos).toBe(caret)
    })

    it('does not modify short list items that fit within the line width', () => {
      const raw = '- short'
      const caret = raw.length
      const { injectedValue, injectedCursorPos } = injectVisualIndents(
        raw,
        caret,
        80,
      )
      expect(injectedValue).toBe(raw)
      expect(injectedCursorPos).toBe(caret)
    })

    it('wraps long list items and prefixes wrapped lines with visual indent', () => {
      const raw = '- abcdefghij' // 10 chars of content, prefix "- " (2 chars)
      const maxChars = 10 // force wrapping after 8 content chars
      const caret = raw.length

      const { injectedValue, injectedCursorPos } = injectVisualIndents(
        raw,
        caret,
        maxChars,
      )

      // Expected physical representation after wrapping:
      // "- abcdefgh" (first 8 chars)
      // "<indent>ij" (remaining 2 chars)
      const expected = `- abcdefgh\n${VISUAL_INDENT_CHAR.repeat(2)}ij`

      expect(injectedValue).toBe(expected)

      // Cursor should be at the end of injected text.
      expect(injectedCursorPos).toBe(expected.length)

      // After stripping, we should get back the original logical line.
      const stripped = stripVisualIndents(injectedValue, injectedCursorPos)
      expect(stripped.sanitizedValue).toBe(raw)
    })
  })
})
