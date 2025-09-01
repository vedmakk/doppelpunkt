import {
  PresentationTransformer,
  TransformResult,
  PresentationContext,
} from '../../types'
import {
  injectString,
  stripString,
  VISUAL_INDENT_CHAR,
} from '../../../utils/visualIndent'

/**
 * Applies transformation for injecting visual indents and calculates cursor position.
 * This handles word-wrapping edge cases where the prefix transformation
 * doesn't capture visual indent characters that affect cursor position.
 */
function applyInjectTransformWithCursor(
  raw: string,
  cursorPos: number,
  transform: (input: string) => string,
): { value: string; cursor: number } {
  const transformedValue = transform(raw)

  // If the cursor is at the end, simply return the end position
  if (cursorPos >= raw.length) {
    return { value: transformedValue, cursor: transformedValue.length }
  }

  // To find the correct cursor position in the transformed text,
  // we need to map the original position by counting how many
  // characters from the original text appear before the cursor
  // position in the transformed text.

  let originalIndex = 0
  let transformedIndex = 0
  const targetOriginalIndex = cursorPos

  // Walk through both strings simultaneously, skipping visual indent chars
  while (
    originalIndex < raw.length &&
    transformedIndex < transformedValue.length
  ) {
    const originalChar = raw[originalIndex]
    const transformedChar = transformedValue[transformedIndex]

    // If we've reached our target position in the original text
    if (originalIndex === targetOriginalIndex) {
      return { value: transformedValue, cursor: transformedIndex }
    }

    // If chars match, advance both pointers
    if (originalChar === transformedChar) {
      originalIndex++
      transformedIndex++
    } else {
      // We're likely at a visual indent character or newline
      // Skip visual indent characters in transformed text
      if (transformedChar === VISUAL_INDENT_CHAR) {
        transformedIndex++
      } else if (transformedChar === '\n' && originalChar !== '\n') {
        // This is an inserted newline due to wrapping
        transformedIndex++
      } else {
        // Other mismatch - advance both (shouldn't happen in normal cases)
        originalIndex++
        transformedIndex++
      }
    }
  }

  // If we've reached the end of the original text but haven't found our position,
  // the cursor should be at the current transformed position
  return { value: transformedValue, cursor: transformedIndex }
}

/**
 * Applies transformation for stripping visual indents and calculates cursor position.
 * The stripString function removes entire patterns of "\n" + visual indent chars,
 * so we need to count both the newline and visual indent characters as removed.
 */
function applyStripTransformWithCursor(
  raw: string,
  cursorPos: number,
  transform: (input: string) => string,
): { value: string; cursor: number } {
  const transformedValue = transform(raw)

  let removedChars = 0
  let index = 0

  while (index < cursorPos && index < raw.length) {
    if (raw[index] === '\n' && index + 1 < raw.length) {
      // Check if there are visual indent chars after the newline
      const visualIndentStart = index + 1
      let visualIndentEnd = visualIndentStart

      while (
        visualIndentEnd < raw.length &&
        raw[visualIndentEnd] === VISUAL_INDENT_CHAR
      ) {
        visualIndentEnd++
      }

      const visualIndentCount = visualIndentEnd - visualIndentStart

      if (visualIndentCount > 0) {
        // stripString removes the entire pattern "\n" + visual indent chars
        if (visualIndentEnd <= cursorPos) {
          // The entire pattern (newline + visual indents) is before the cursor
          removedChars += 1 + visualIndentCount // 1 for newline + visual indent chars
          index = visualIndentEnd
        } else {
          // Cursor is within the visual indent sequence
          // The newline + chars up to cursor position are removed
          const charsToRemove = cursorPos - index // includes newline + partial visual indents
          removedChars += charsToRemove
          break
        }
      } else {
        index++
      }
    } else {
      index++
    }
  }

  return {
    value: transformedValue,
    cursor: cursorPos - removedChars,
  }
}

export const visualIndentTransformer: PresentationTransformer = {
  name: 'visualIndent',
  transform: (text: string, context: PresentationContext): TransformResult => {
    if (!text) {
      return { text, cursorPos: context.cursorPos }
    }

    const maxCharsPerLine = context.maxCharsPerLine ?? 80

    const injectStringWithMaxChars = (raw: string) =>
      injectString(raw, maxCharsPerLine)

    const { value: transformedText, cursor: transformedCursorPos } =
      applyInjectTransformWithCursor(
        text,
        context.cursorPos,
        injectStringWithMaxChars,
      )

    return {
      text: transformedText,
      cursorPos: transformedCursorPos,
    }
  },
}

export const visualIndentStripper: PresentationTransformer = {
  name: 'visualIndentStripper',
  transform: (text: string, context: PresentationContext): TransformResult => {
    if (!text) {
      return { text, cursorPos: context.cursorPos }
    }

    const { value: transformedText, cursor: transformedCursorPos } =
      applyStripTransformWithCursor(text, context.cursorPos, stripString)

    return {
      text: transformedText,
      cursorPos: transformedCursorPos,
    }
  },
}
