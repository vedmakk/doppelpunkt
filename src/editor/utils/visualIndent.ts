/**
 * Utility helpers for injecting and stripping visual indentation markers that
 * are used to simulate hanging indents for soft-wrapped Markdown list items.
 *
 * We prefix soft-wrapped visual lines (i.e. the 2nd physical line and beyond
 * produced by the browser’s soft-wrapping) with a sequence of en-space
 * characters so that they align nicely underneath the text that follows the
 * original list bullet ("- ", "1.", etc.).
 *
 * The characters are **only** meant for on-screen presentation.  Any editor
 * interaction that feeds the text back into persistence / business logic must
 * remove them again.
 */

export const VISUAL_INDENT_CHAR = '\u2002' // en-space – visually consistent and has fixed width in monospaced fonts

// RegExp that removes every occurrence of "\n<en-spaces+>" which is exactly the
// pattern we insert when simulating a soft wrap.
const VISUAL_INDENT_PATTERN = new RegExp(`\n${VISUAL_INDENT_CHAR}+`, 'g')

/**
 * Removes any artificial visual indents from the supplied string so that the
 * returned value only contains the *logical* Markdown content.
 */
export function stripVisualIndents(value: string): string {
  return value.replace(VISUAL_INDENT_PATTERN, '')
}

/**
 * Inserts visual hanging indents for soft-wrapped Markdown list items.
 *
 * Algorithm (monospace assumption):
 *   1. Split the content into logical lines by "\n".
 *   2. Detect Markdown list item prefixes using a RegExp.
 *   3. Whenever a list line’s *content* length exceeds the available space of
 *      the first physical line (maxCharsPerLine minus prefix length) we hard
 *      wrap the line at word boundaries and prefix each additional physical
 *      line with en-spaces matching the prefix length.
 *
 * NOTE: The function purposefully keeps the logic simple and deterministic –
 *       it does *not* try to replicate the browser’s exact wrapping algorithm
 *       (which would be exceptionally complex).  With a monospace font and
 *       basic word-wrapping rules, the character-based approach is good enough
 *       to keep the textarea’s caret and the syntax-highlighting overlay in
 *       sync while providing the desired visual indentation.
 */
export function injectVisualIndents(
  raw: string,
  maxCharsPerLine: number,
): string {
  if (!raw) return raw

  const listPrefixRegex = /^(\s*)(?:([-+*])|(\d+[.)]))\s+/

  const physicalLines: string[] = []

  const logicalLines = raw.split('\n')

  for (const line of logicalLines) {
    const prefixMatch = line.match(listPrefixRegex)

    if (!prefixMatch) {
      // Not a list item – push as-is
      physicalLines.push(line)
      continue
    }

    const prefix = prefixMatch[0] // bullet incl. trailing space(s)
    const content = line.slice(prefix.length)

    const spaceForFirstLine = maxCharsPerLine - prefix.length

    if (spaceForFirstLine <= 0 || content.length <= spaceForFirstLine) {
      physicalLines.push(line)
      continue
    }

    // Hard-wrap the line so that each physical line respects the character
    // limit.
    let cursor = 0

    // First physical line keeps the list prefix.
    physicalLines.push(prefix + content.slice(0, spaceForFirstLine))
    cursor += spaceForFirstLine

    // Subsequent physical lines get visual indent.
    const indent = VISUAL_INDENT_CHAR.repeat(prefix.length)
    const spacePerWrappedLine = maxCharsPerLine - prefix.length

    while (cursor < content.length) {
      const part = content.slice(cursor, cursor + spacePerWrappedLine)
      physicalLines.push(indent + part)
      cursor += spacePerWrappedLine
    }
  }

  return physicalLines.join('\n')
}
