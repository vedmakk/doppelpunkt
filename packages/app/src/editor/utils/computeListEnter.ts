import { PresentationContext } from '../sanitization'
import { visualIndentStripper } from '../sanitization/presentation/transformers/visualIndentTransformer'

export interface ComputeListEnterOptions {
  /** Current textarea value */
  value: string
  /** Caret start index */
  selectionStart: number
  /** Caret end index (for selections, usually same as start) */
  selectionEnd: number
  /** Whether the Shift key is held */
  shiftKey: boolean
}

export interface ComputeListEnterResult {
  /** Updated textarea value */
  newValue: string
  /** New caret position after the mutation */
  newCursor: number
}

/**
 * Pure helper that reproduces the behaviour implemented in the Markdown editor
 * when the user presses the Enter key inside a Markdown list item.
 *
 * The algorithm mirrors the previous inline implementation found in
 * `MarkdownEditor.tsx` but is extracted so that it can be unit-tested.
 *
 * If the current line is *not* a Markdown list item the function returns
 * `undefined` to signal that the caller should fall back to default browser
 * behaviour.
 */
export function computeListEnter(
  opts: ComputeListEnterOptions,
): ComputeListEnterResult | undefined {
  const { value, selectionStart, selectionEnd, shiftKey } = opts

  const context: PresentationContext = {
    text: value,
    cursorPos: selectionStart,
  }

  // Strip visual indents and obtain the caret position in the sanitized
  // string so that we can correctly analyse the logical Markdown content.
  const { text: sanitizedValue, cursorPos: sanitizedSelectionStart } =
    visualIndentStripper.transform(value, context)

  // Determine the boundaries of the current logical line.
  const lineStart =
    sanitizedValue.lastIndexOf('\n', sanitizedSelectionStart - 1) + 1 // -1 => -1 + 1 = 0
  const lineEndIndex = sanitizedValue.indexOf('\n', sanitizedSelectionStart)
  const lineEnd = lineEndIndex === -1 ? sanitizedValue.length : lineEndIndex

  const currentLine = sanitizedValue.slice(lineStart, lineEnd)

  // RegEx to match unordered (-,*,+) or ordered (1., 2. ...)
  const listPrefixMatch = currentLine.match(
    /^(\s*)(?:([-+*>])|((?:\d+)[.)]))\s+/,
  )

  if (!listPrefixMatch) {
    // The caret is not inside a list item – let the browser handle it.
    return undefined
  }

  const prefix = listPrefixMatch[0] // includes trailing spaces

  // Shift+Enter => soft line-break (stays inside current list item)
  if (shiftKey) {
    const insertion = '\n' + ' '.repeat(prefix.length)
    const newCursor = selectionStart + insertion.length

    const newValue =
      value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)

    return { newValue, newCursor }
  }

  // Content after the prefix up to the caret position
  const afterPrefix = currentLine.slice(prefix.length).trim()

  const isEmptyItem = afterPrefix === ''

  if (isEmptyItem) {
    // Exit behaviour – remove the list marker and insert plain newline.
    const originalLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
    const beforePrefix = value.slice(0, originalLineStart)
    const afterCaret = value.slice(selectionEnd)

    const newValue = beforePrefix + '\n' + afterCaret
    const newCursor = beforePrefix.length + 1 // position after inserted newline

    return { newValue, newCursor }
  }

  // Continue the list by inserting a new line with the same prefix.
  const insertion = '\n' + prefix
  const newValue =
    value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)

  const newCursor = selectionStart + insertion.length

  return { newValue, newCursor }
}
