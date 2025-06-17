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
      const stripped = stripVisualIndents(input)

      // Expect the newline + indent chars to be removed
      expect(stripped).toBe('- itemcontinued')
    })

    it('is a no-op when no visual indents are present', () => {
      const input = 'Plain text without indents'
      expect(stripVisualIndents(input)).toBe(input)
    })
  })

  describe('injectVisualIndents', () => {
    it('returns the original text when no list item is present', () => {
      const raw = 'Just a regular paragraph that should stay untouched.'
      const result = injectVisualIndents(raw, 80)
      expect(result).toBe(raw)
    })

    it('does not modify short list items that fit within the line width', () => {
      const raw = '- short'
      const result = injectVisualIndents(raw, 80)
      expect(result).toBe(raw)
    })

    it('wraps long list items and prefixes wrapped lines with visual indent', () => {
      const raw = '- abcdefghij' // 10 chars of content, prefix "- " (2 chars)
      const maxChars = 10 // force wrapping after 8 content chars

      const result = injectVisualIndents(raw, maxChars)

      // Expected physical representation after wrapping:
      // "- abcdefgh" (first 8 chars)
      // "<indent>ij" (remaining 2 chars)
      const expected = `- abcdefgh\n${VISUAL_INDENT_CHAR.repeat(2)}ij`

      expect(result).toBe(expected)

      // After stripping, we should get back the original logical line.
      expect(stripVisualIndents(result)).toBe(raw)
    })
  })
})
