/**
 * Utility helpers for injecting and stripping visual indentation markers that
 * are used to simulate hanging indents for soft-wrapped Markdown list items.
 *
 * We prefix soft-wrapped visual lines (i.e. the 2nd physical line and beyond
 * produced by the browser's soft-wrapping) with a sequence of en-space
 * characters so that they align nicely underneath the text that follows the
 * original list bullet ("- ", "1.", etc.).
 *
 * The characters are **only** meant for on-screen presentation.  Any editor
 * interaction that feeds the text back into persistence / business logic must
 * remove them again.
 */
import wrap from 'word-wrap'

export const VISUAL_INDENT_CHAR = '\u2002' // en-space – visually consistent and has fixed width in monospaced fonts

// RegExp that removes every occurrence of "\n<en-spaces+>" which is exactly the
// pattern we insert when simulating a soft wrap.
const VISUAL_INDENT_PATTERN = new RegExp(`\n${VISUAL_INDENT_CHAR}+`, 'g')

/**
 * Removes any artificial visual indents from the supplied string so that the
 * returned value only contains the *logical* Markdown content.
 */
export const stripString = (raw: string): string =>
  raw.replace(VISUAL_INDENT_PATTERN, '')

/**
 * Inserts visual hanging indents for soft-wrapped Markdown list items.
 *
 * Algorithm (monospace assumption):
 *   1. Split the content into logical lines by "\n".
 *   2. Detect Markdown list item prefixes using a RegExp.
 *   3. Whenever a list line's *content* length exceeds the available space of
 *      the first physical line (maxCharsPerLine minus prefix length) we hard
 *      wrap the line at word boundaries and prefix each additional physical
 *      line with en-spaces matching the prefix length.
 *
 * NOTE: The function purposefully keeps the logic simple and deterministic –
 *       it does *not* try to replicate the browser's exact wrapping algorithm
 *       (which would be exceptionally complex).  With a monospace font and
 *       basic word-wrapping rules, the character-based approach is good enough
 *       to keep the textarea's caret and the syntax-highlighting overlay in
 *       sync while providing the desired visual indentation.
 */
export const injectString = (raw: string, maxCharsPerLine: number): string => {
  if (!raw) return raw

  const listPrefixRegex = /^(\s*)(?:([-+*>])|(\d+[.)]))\s+/

  const physicalLines: string[] = []

  const logicalLines = raw.split('\n')

  for (const line of logicalLines) {
    const prefixMatch = line.match(listPrefixRegex)

    if (!prefixMatch) {
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

    // When the content exceeds the available space we wrap at *word*
    // boundaries to avoid splitting words in the middle.  We use the
    // "word-wrap" library for this purpose.  The approach is:
    //   1. Word-wrap the *content* (excluding the list prefix).
    //   2. Prepend the original prefix to the first wrapped line.
    //   3. For every subsequent physical line, prefix an equivalent amount
    //      of en-spaces so that the text aligns visually with the first
    //      line's content.

    const indent = VISUAL_INDENT_CHAR.repeat(prefix.length)

    // Wrap only the content (without prefix) so that the calculated width
    // matches the available characters of the *content* section.
    const wrappedContent = wrap(content, {
      width: spaceForFirstLine, // identical for first and subsequent lines
      trim: false,
      cut: true, // do not split a word unless it exceeds the width itself
      indent: '', // override word-wrap's default two-space indent
      newline: '\n',
    })

    const wrappedLines = wrappedContent.split('\n')

    // First physical line keeps the bullet prefix.
    physicalLines.push(prefix + wrappedLines[0])

    // Remaining physical lines receive the visual indent.
    for (let i = 1; i < wrappedLines.length; i++) {
      physicalLines.push(indent + wrappedLines[i])
    }
  }

  return physicalLines.join('\n')
}
