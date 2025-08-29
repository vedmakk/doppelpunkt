import { describe, it, expect } from 'bun:test'
import { characterSanitizer } from '../characterSanitizer'
import { StorageContext } from '../../../types'

describe('characterSanitizer', () => {
  const createContext = (originalCursorPos = 0): StorageContext => ({
    originalText: '',
    originalCursorPos,
    mode: 'editor' as const,
  })

  it('handles line separator characters', () => {
    const input = 'Line 1\u2028Line 2\u2029Line 3'
    const expected = 'Line 1\nLine 2\nLine 3'
    const context = createContext(0)

    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('removes zero-width spaces', () => {
    const input = 'Hello\u200BWorld\u200C!\u200D'
    const expected = 'HelloWorld!'
    const context = createContext(0)

    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('removes byte order mark', () => {
    const input = '\uFEFFHello World'
    const expected = 'Hello World'
    const context = createContext(0)

    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('normalizes whitespace', () => {
    const input = 'Text with\u00A0nbsp\r\nand\rCRLF'
    const expected = 'Text with nbsp\nand\nCRLF'
    const context = createContext(0)

    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('maintains cursor position after basic replacement', () => {
    const input = 'Hello\u2028World'
    const result = characterSanitizer.sanitize(input, createContext(7))

    expect(result.text).toBe('Hello\nWorld')
    expect(result.cursorPos).toBe(7) // No adjustment needed - same length replacement
  })

  it('handles multiple replacements before cursor', () => {
    const input = '\u200B\u200BHello\u2028World'
    const result = characterSanitizer.sanitize(input, createContext(8))

    expect(result.text).toBe('Hello\nWorld')
    expect(result.cursorPos).toBe(6) // Cursor adjusts for all replacements
  })

  it('handles cursor at end of string', () => {
    const input = 'Hello\u200BWorld'
    const result = characterSanitizer.sanitize(
      input,
      createContext(input.length),
    )

    expect(result.text).toBe('HelloWorld')
    expect(result.cursorPos).toBe(10) // Adjusted for removed character
  })

  it('handles cursor before any problematic characters', () => {
    const input = 'Hello\u200BWorld'
    const result = characterSanitizer.sanitize(input, createContext(3))

    expect(result.text).toBe('HelloWorld')
    expect(result.cursorPos).toBe(3) // No adjustment needed
  })

  it('handles cursor after all problematic characters', () => {
    const input = '\u200BHello\u200BWorld'
    const result = characterSanitizer.sanitize(
      input,
      createContext(input.length),
    )

    expect(result.text).toBe('HelloWorld')
    expect(result.cursorPos).toBe(10) // Adjusted for both removed characters
  })

  it('handles empty input', () => {
    const result = characterSanitizer.sanitize('', createContext(0))

    expect(result.text).toBe('')
    expect(result.cursorPos).toBe(0)
  })

  it('handles null-like input', () => {
    const result = characterSanitizer.sanitize('', createContext(5))

    expect(result.text).toBe('')
    expect(result.cursorPos).toBe(5) // Preserves original cursor pos for empty strings
  })

  it('clamps cursor position to valid range', () => {
    const input = 'Hello\u200BWorld'
    const result = characterSanitizer.sanitize(input, createContext(100))

    expect(result.text).toBe('HelloWorld')
    expect(result.cursorPos).toBe(10) // Clamped to string length
  })

  it('handles negative cursor position', () => {
    const input = 'Hello\u200BWorld'
    const result = characterSanitizer.sanitize(input, createContext(-5))

    expect(result.text).toBe('HelloWorld')
    expect(result.cursorPos).toBe(0) // Clamped to 0
  })

  it('handles complex combination of problematic characters', () => {
    const input = '\uFEFF\u200BHello\u2028\u00A0World\r\n\u200CEnd\u2029'
    const expected = 'Hello\n World\nEnd\n'
    const context = createContext(15)

    const result = characterSanitizer.sanitize(input, context)

    expect(result.text).toBe(expected)
    expect(result.cursorPos).toBe(12) // Adjusted for all removed/replaced characters
  })

  it('handles Windows line endings', () => {
    const input = 'Line 1\r\nLine 2\r\nLine 3'
    const expected = 'Line 1\nLine 2\nLine 3'
    const context = createContext(8)

    const result = characterSanitizer.sanitize(input, context)

    expect(result.text).toBe(expected)
    expect(result.cursorPos).toBe(7) // Adjusted for shorter line endings
  })

  it('handles old Mac line endings', () => {
    const input = 'Line 1\rLine 2\rLine 3'
    const expected = 'Line 1\nLine 2\nLine 3'
    const context = createContext(8)

    const result = characterSanitizer.sanitize(input, context)

    expect(result.text).toBe(expected)
    expect(result.cursorPos).toBe(8) // No adjustment needed for same-length replacement
  })

  it('preserves regular content unchanged', () => {
    const input = 'This is normal text with spaces and newlines.\nSecond line!'
    const context = createContext(25)

    const result = characterSanitizer.sanitize(input, context)

    expect(result.text).toBe(input)
    expect(result.cursorPos).toBe(25)
  })
})
