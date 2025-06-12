import React, { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { useEditorText, useCaptureTabEnabled } from '../hooks'
import { setText, setCaptureTab } from '../editorSlice'
import { useHotkey } from '../../hotkeys/hooks'
import { getHotkey } from '../../hotkeys/registry'

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

  const captureTabHotkey = getHotkey('toggleCaptureTab')
  useHotkey(
    'toggleCaptureTab',
    captureTabHotkey?.defaultKeys || 'ctrl+shift+m',
    () => dispatch(setCaptureTab(!captureTab)),
  )

  return (
    <MarkdownEditorComponent
      content={content}
      onContentChange={handleContentChange}
      captureTab={captureTab}
    />
  )
}

export default MarkdownEditor
