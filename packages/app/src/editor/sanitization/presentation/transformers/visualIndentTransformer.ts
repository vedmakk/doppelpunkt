import {
  PresentationTransformer,
  TransformResult,
  PresentationContext,
} from '../../types'
import { injectString, stripString } from '../../../utils/visualIndent'

/**
 * Applies transformation to cursor position when transforming text.
 * This is extracted from the original visualIndent.ts utility.
 */
function applyTransformWithCursor(
  raw: string,
  cursorPos: number,
  transform: (input: string) => string,
): { value: string; cursor: number } {
  const prefix = raw.slice(0, cursorPos)
  const transformedPrefix = transform(prefix)
  const transformedValue = transform(raw)

  return { value: transformedValue, cursor: transformedPrefix.length }
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
      applyTransformWithCursor(
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
      applyTransformWithCursor(text, context.cursorPos, stripString)

    return {
      text: transformedText,
      cursorPos: transformedCursorPos,
    }
  },
}
