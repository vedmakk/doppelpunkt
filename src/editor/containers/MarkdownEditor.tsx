import React, { useCallback } from 'react'

import { stripVisualIndents } from '../utils/visualIndent'
import { computeListEnter } from '../utils/computeListEnter'

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

      const result = computeListEnter({
        value: textarea.value,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
        shiftKey: e.shiftKey,
      })

      if (!result) {
        // Not a list scenario – allow default behaviour.
        return
      }

      const { newValue, newCursor } = result

      e.preventDefault()

      handleContentChange(stripVisualIndents(newValue))

      // Restore caret position in the next tick once React has flushed the
      // state update and the value prop has propagated to the underlying
      // textarea.
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
