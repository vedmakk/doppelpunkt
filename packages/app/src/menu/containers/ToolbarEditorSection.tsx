import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { clear, load } from '../../editor/editorSlice'
import { closeMenu } from '../menuSlice'

import { useEditorText, useEditorContentStats } from '../../editor/hooks'
import { useWritingMode } from '../../mode/hooks'
import { useFullMenuWidth } from '../../theme/hooks'

import ToolbarEditorSectionComponent from '../components/ToolbarEditorSection'

const ToolbarEditorSection: React.FC = () => {
  const content = useEditorText()
  const stats = useEditorContentStats()
  const mode = useWritingMode()

  const isFullMenuWidth = useFullMenuWidth()

  const dispatch = useDispatch()

  const handleNew = useCallback(() => {
    dispatch(clear({ mode }))
    if (!isFullMenuWidth) {
      dispatch(closeMenu())
    }
  }, [dispatch, isFullMenuWidth, mode])

  const handleOpen = useCallback(
    (text: string) => {
      if (typeof text === 'string') {
        dispatch(load({ mode, text }))
        if (!isFullMenuWidth) {
          dispatch(closeMenu())
        }
      }
    },
    [dispatch, isFullMenuWidth, mode],
  )

  return (
    <ToolbarEditorSectionComponent
      content={content}
      stats={stats}
      onNew={handleNew}
      onOpen={handleOpen}
    />
  )
}

export default ToolbarEditorSection
