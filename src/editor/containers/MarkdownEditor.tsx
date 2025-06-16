import React, { useCallback } from 'react'

import { stripVisualIndents } from '../utils/visualIndent'

import { useDispatch } from 'react-redux'

import { useEditorText, useCaptureTabEnabled } from '../hooks'
import { setText, setCaptureTab } from '../editorSlice'
import { useCustomHotkey } from '../../hotkeys/hooks'
import { HotkeyId } from '../../hotkeys/registry'

import MarkdownEditorComponent from '../components/MarkdownEditor'

const MarkdownEditor: React.FC = () => {
  const content = useEditorText()
  const captureTab = useCaptureTabEnabled()

  const dispatch = useDispatch()

  const handleContentChange = useCallback(
    (content: string) => {
      dispatch(setText(content))
    },
    [dispatch],
  )

  const toggleCaptureTab = useCallback(() => {
    dispatch(setCaptureTab(!captureTab))
  }, [dispatch, captureTab])

  useCustomHotkey(HotkeyId.ToggleCaptureTab, toggleCaptureTab)

  // Handle custom list behaviours and Shift+Enter soft line breaks
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') {
        return
      }

      if (!(e.currentTarget instanceof HTMLTextAreaElement)) {
        return
      }

      const textarea = e.currentTarget as HTMLTextAreaElement

      const { value, selectionStart, selectionEnd } = textarea

      // Regular Enter – handle Markdown list continuation / exit behaviour.
      // Determine the boundaries of the current logical line.
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1 // -1 => -1 + 1 = 0
      const lineEndIndex = value.indexOf('\n', selectionStart)
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex

      const currentLine = value.slice(lineStart, lineEnd)

      // RegEx to match unordered (-,*,+) or ordered (1., 2. ...)
      const listPrefixMatch = currentLine.match(
        /^(\s*)(?:([-+*])|((?:\d+)[.)]))\s+/,
      )

      if (!listPrefixMatch) {
        // Not a list line – allow default behaviour.
        return
      }

      e.preventDefault()

      const prefix = listPrefixMatch[0] // includes trailing spaces

      // Shift+Enter => soft line-break (two spaces at EOL)
      if (e.shiftKey) {
        const insertion = '\n' + ' '.repeat(prefix.length)
        const newCursor = selectionStart + insertion.length

        const newValue =
          value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)

        handleContentChange(stripVisualIndents(newValue))

        // Restore caret position in the next tick once React has flushed the
        // state update and the value prop has propagated to the underlying
        // textarea.
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = newCursor
        })

        return
      }

      // Content after the prefix up to the caret position
      const afterPrefix = currentLine.slice(prefix.length).trim()

      const isEmptyItem = afterPrefix === ''

      let newValue: string
      let newCursor: number

      if (isEmptyItem) {
        // Exit behaviour – remove the list marker and insert plain newline.
        // Value before the list prefix...
        const beforePrefix = value.slice(0, lineStart)
        const afterCaret = value.slice(selectionEnd)

        newValue = beforePrefix + '\n' + afterCaret
        newCursor = beforePrefix.length + 1 // position after inserted newline
      } else {
        // Continue the list by inserting a new line with the same prefix.
        const insertion = '\n' + prefix
        newValue =
          value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)

        newCursor = selectionStart + insertion.length
      }

      handleContentChange(stripVisualIndents(newValue))

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursor
      })
    },
    [handleContentChange],
  )

  return (
    <MarkdownEditorComponent
      content={content}
      onContentChange={handleContentChange}
      captureTab={captureTab}
      onKeyDown={handleKeyDown}
    />
  )
}

export default MarkdownEditor
