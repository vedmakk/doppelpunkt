import {
  StorageSanitizer,
  SanitizationResult,
  StorageContext,
} from '../../types'

const REPLACEMENTS: [RegExp | string, string][] = [
  // Line Separator Characters
  [/\u2028|\u2029/g, '\n'], // Replace line/paragraph separators with regular newlines
  // \u2028: Line Separator
  // \u2029: Paragraph Separator

  // Zero-Width Characters
  [/[\u200B\u200C\u200D]/g, ''], // Remove zero-width spaces and joiners
  [/\uFEFF/g, ''], // Remove Byte Order Mark separately
  // \u200B: Zero-width space
  // \u200C: Zero-width non-joiner
  // \u200D: Zero-width joiner
  // \uFEFF: Byte Order Mark

  // Whitespace Normalization
  [/\u00A0/g, ' '], // Replace non-breaking space with regular space
  [/\r\n?/g, '\n'], // Normalize Windows/old Mac line endings to \n
]

export const characterSanitizer: StorageSanitizer = {
  name: 'characterCleaner',
  sanitize: (text: string, context: StorageContext): SanitizationResult => {
    if (!text) return { text, cursorPos: context.originalCursorPos }

    let adjustedCursorPos = context.originalCursorPos
    let cleanedValue = text

    for (const [pattern, replacement] of REPLACEMENTS) {
      // For each replacement, we need to:
      // 1. Find all matches and calculate cursor adjustments
      // 2. Apply the replacement
      const regex =
        pattern instanceof RegExp
          ? new RegExp(pattern.source, pattern.flags)
          : new RegExp(pattern, 'g')

      let match
      let cursorAdjustment = 0
      const matches: Array<{
        index: number
        length: number
        replacement: string
      }> = []

      // Collect all matches first
      while ((match = regex.exec(cleanedValue)) !== null) {
        const matchLength = match[0].length
        matches.push({
          index: match.index,
          length: matchLength,
          replacement,
        })

        // Prevent infinite loop with zero-width matches
        if (matchLength === 0) {
          regex.lastIndex++
        }
      }

      // Calculate cursor adjustment based on matches before cursor position
      for (const matchInfo of matches) {
        if (matchInfo.index < adjustedCursorPos) {
          cursorAdjustment += matchInfo.replacement.length - matchInfo.length
        }
      }

      adjustedCursorPos += cursorAdjustment

      // Apply the actual replacement
      cleanedValue = cleanedValue.replace(
        pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g'),
        replacement,
      )
    }

    return {
      text: cleanedValue,
      cursorPos: Math.max(0, Math.min(adjustedCursorPos, cleanedValue.length)),
    }
  },
}
