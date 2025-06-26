import { describe, it, expect } from 'bun:test'

import {
  stripString,
  injectString,
  injectVisualIndents,
  stripVisualIndents,
  VISUAL_INDENT_CHAR,
} from './visualIndent'

describe('visualIndent utilities', () => {
  describe('stripString', () => {
    it('removes visual indent characters that follow a newline', () => {
      const input = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const sanitizedValue = stripString(input)
      expect(sanitizedValue).toBe('- itemcontinued')
    })

    it('is a no-op when no visual indents are present', () => {
      const input = 'Plain text without indents'
      const result = stripString(input)
      expect(result).toEqual(input)
    })
  })

  describe('injectString', () => {
    it('returns the original text when no list item is present', () => {
      const raw = 'Just a regular paragraph that should stay untouched.'
      const injectedValue = injectString(raw, 80)
      expect(injectedValue).toBe(raw)
    })

    it('does not modify short list items that fit within the line width', () => {
      const raw = '- short'
      const injectedValue = injectString(raw, 80)
      expect(injectedValue).toBe(raw)
    })

    it('wraps long list items at word boundaries and adds visual indentation', () => {
      const raw = '- lorem ipsum' // total length 13 (prefix 2 + 11 content)
      const maxChars = 10 // available content chars: 8 – forces wrapping after the first word
      const injectedValue = injectString(raw, maxChars)

      // Expected physical representation after wrapping:
      // "- lorem " (first word incl. the trailing space that preceded the wrap)
      // "<indent>ipsum" (second word)
      const expected = `- lorem \n${VISUAL_INDENT_CHAR.repeat(2)}ipsum`

      expect(injectedValue).toBe(expected)

      // After stripping, we should get back the original logical line.
      const stripped = stripString(injectedValue)
      expect(stripped).toBe(raw)
    })
  })

  describe('stripVisualIndents', () => {
    it('adjusts the cursor position when indents were present before the cursor', () => {
      const input = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const caret = 10
      const { sanitizedValue, sanitizedCursorPos } = stripVisualIndents(
        input,
        caret,
      )
      expect(sanitizedValue).toBe('- itemcontinued')
      expect(sanitizedCursorPos).toBe(caret - 3)
    })

    it('adjusts the cursor position only for indents that were present before the cursor', () => {
      const input = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const caret = 10
      const { sanitizedValue, sanitizedCursorPos } = stripVisualIndents(
        input,
        caret,
      )
      expect(sanitizedValue).toBe('- itemcontinuedcontinued')
      expect(sanitizedCursorPos).toBe(caret - 3)
    })

    it('does not adjust the cursor position for indents that were present after the cursor', () => {
      const input = `- itemcontinued\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const caret = 10
      const { sanitizedValue, sanitizedCursorPos } = stripVisualIndents(
        input,
        caret,
      )
      expect(sanitizedValue).toBe('- itemcontinuedcontinued')
      expect(sanitizedCursorPos).toBe(caret)
    })
  })

  describe('injectVisualIndents', () => {
    it('adjusts the cursor position when indents were inserted before the cursor', () => {
      const raw = '- lorem ipsum'
      const maxChars = 7
      const caret = raw.length
      const { injectedValue, injectedCursorPos } = injectVisualIndents(
        raw,
        caret,
        maxChars,
      )
      expect(injectedValue).toBe(
        `- lorem \n${VISUAL_INDENT_CHAR.repeat(2)}ipsum`,
      )
      expect(injectedCursorPos).toBe(caret + 3)
    })

    it('adjust the cursor position only for indents that were inserted before the cursor', () => {
      const raw = '- ' + 'test '.repeat(3)
      const maxChars = 'test'.length
      const caret = 'test'.length + 4 // after the first 'test'
      const { injectedValue, injectedCursorPos } = injectVisualIndents(
        raw,
        caret,
        maxChars,
      )
      expect(injectedValue).toBe(
        `- test \n${VISUAL_INDENT_CHAR.repeat(2)}test \n${VISUAL_INDENT_CHAR.repeat(2)}test `,
      )
      expect(injectedCursorPos).toBe(caret + 3)
    })

    it('does not adjust the cursor position for indents that were inserted after the cursor', () => {
      const raw = '- lorem ipsum'
      const maxChars = 7
      const caret = 3
      const { injectedValue, injectedCursorPos } = injectVisualIndents(
        raw,
        caret,
        maxChars,
      )
      expect(injectedValue).toBe(
        `- lorem \n${VISUAL_INDENT_CHAR.repeat(2)}ipsum`,
      )
      expect(injectedCursorPos).toBe(caret)
    })
  })
})
