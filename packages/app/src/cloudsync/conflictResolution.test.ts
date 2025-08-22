import { describe, it, expect } from 'bun:test'
import { resolveTextConflict } from './conflictResolution'

describe('resolveTextConflict', () => {
  describe('no conflict scenarios', () => {
    it('returns local text when local and remote are identical', () => {
      const baseText = 'original text'
      const localText = 'modified text'
      const remoteText = 'modified text'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result).toEqual({
        mergedText: 'modified text',
        wasConflicted: false,
        mergeSuccessful: true,
      })
    })

    it('returns remote text when only remote changed', () => {
      const baseText = 'original text'
      const localText = 'original text'
      const remoteText = 'remote changed text'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result).toEqual({
        mergedText: 'remote changed text',
        wasConflicted: false,
        mergeSuccessful: true,
      })
    })

    it('returns local text when only local changed', () => {
      const baseText = 'original text'
      const localText = 'local changed text'
      const remoteText = 'original text'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result).toEqual({
        mergedText: 'local changed text',
        wasConflicted: false,
        mergeSuccessful: true,
      })
    })
  })

  describe('conflict scenarios', () => {
    it('successfully merges non-overlapping changes', () => {
      const baseText = 'Line 1\nLine 2\nLine 3'
      const localText = 'Line 1 LOCAL\nLine 2\nLine 3'
      const remoteText = 'Line 1\nLine 2\nLine 3 REMOTE'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(result.mergeSuccessful).toBe(true)
      expect(result.mergedText).toBe('Line 1 LOCAL\nLine 2\nLine 3 REMOTE')
    })

    it('handles overlapping changes by merging when possible', () => {
      const baseText = 'Hello world'
      const localText = 'Hello LOCAL world'
      const remoteText = 'Hello REMOTE world'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      // The diff-match-patch algorithm can actually merge these changes
      expect(result.mergedText).toBe('Hello LOCAL REMOTE world')
    })

    it('merges additions at different positions', () => {
      const baseText = 'A\nB\nC'
      const localText = 'A\nLOCAL\nB\nC'
      const remoteText = 'A\nB\nC\nREMOTE'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(result.mergeSuccessful).toBe(true)
      expect(result.mergedText).toBe('A\nLOCAL\nB\nC\nREMOTE')
    })

    it('handles deletion conflicts', () => {
      const baseText = 'Line 1\nLine 2\nLine 3'
      const localText = 'Line 1\nLine 3' // deleted Line 2
      const remoteText = 'Line 1\nLine 2 MODIFIED\nLine 3' // modified Line 2

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      // The specific result depends on diff-match-patch algorithm
      expect(typeof result.mergedText).toBe('string')
    })

    it('handles empty text scenarios', () => {
      const baseText = ''
      const localText = 'local content'
      const remoteText = 'remote content'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(typeof result.mergedText).toBe('string')
    })

    it('handles whitespace and formatting changes', () => {
      const baseText = 'function hello() {\n  return "world"\n}'
      const localText = 'function hello() {\n  return "world!"\n}'
      const remoteText = 'function hello() {\n    return "world"\n}'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(result.mergeSuccessful).toBe(true)
      expect(result.mergedText).toBe(
        'function hello() {\n    return "world!"\n}',
      )
    })

    it('handles large text differences', () => {
      const baseText = 'A'.repeat(1000)
      const localText = 'A'.repeat(500) + 'LOCAL' + 'A'.repeat(500)
      const remoteText = 'A'.repeat(1000) + 'REMOTE'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(typeof result.mergedText).toBe('string')
      expect(result.mergedText.length).toBeGreaterThan(1000)
    })
  })

  describe('edge cases', () => {
    it('handles all empty strings', () => {
      const result = resolveTextConflict('', '', '')

      expect(result).toEqual({
        mergedText: '',
        wasConflicted: false,
        mergeSuccessful: true,
      })
    })

    it('handles unicode characters', () => {
      const baseText = '🚀 Base text'
      const localText = '🚀 Local text 📝'
      const remoteText = '🚀 Remote text 🌟'

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(typeof result.mergedText).toBe('string')
      expect(result.mergedText).toContain('🚀')
    })

    it('handles very long lines', () => {
      const longLine =
        'This is a very long line that goes on and on and on. '.repeat(100)
      const baseText = longLine
      const localText = longLine + 'LOCAL'
      const remoteText = 'REMOTE ' + longLine

      const result = resolveTextConflict(baseText, localText, remoteText)

      expect(result.wasConflicted).toBe(true)
      expect(result.mergeSuccessful).toBe(true)
      expect(result.mergedText).toContain('REMOTE')
      expect(result.mergedText).toContain('LOCAL')
    })
  })
})
