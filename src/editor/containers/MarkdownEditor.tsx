import React, { useCallback } from 'react'

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

  return (
    <MarkdownEditorComponent
      content={content}
      onContentChange={handleContentChange}
      captureTab={captureTab}
    />
  )
}

export default MarkdownEditor
