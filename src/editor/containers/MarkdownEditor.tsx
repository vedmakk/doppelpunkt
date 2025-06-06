import React, { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { useEditorText } from '../hooks'
import { setText } from '../editorSlice'

import MarkdownEditorComponent from '../components/MarkdownEditor'

const MarkdownEditor: React.FC = () => {
  const content = useEditorText()

  const dispatch = useDispatch()

  const handleContentChange = useCallback(
    (content: string) => {
      dispatch(setText(content))
    },
    [dispatch],
  )

  return (
    <MarkdownEditorComponent
      content={content}
      onContentChange={handleContentChange}
    />
  )
}

export default MarkdownEditor
