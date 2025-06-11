import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { clear, load, toggleAutoSave } from '../../editor/editorSlice'
import { closeMenu } from '../menuSlice'

import {
  useEditorText,
  useAutoSaveEnabled,
  useEditorContentStats,
} from '../../editor/hooks'
import { useFullMenuWidth } from '../../theme/hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
  const content = useEditorText()
  const autoSaveEnabled = useAutoSaveEnabled()
  const stats = useEditorContentStats()

  const isFullMenuWidth = useFullMenuWidth()

  const dispatch = useDispatch()

  const handleNew = useCallback(() => {
    dispatch(clear())
    if (!isFullMenuWidth) {
      dispatch(closeMenu())
    }
  }, [dispatch, isFullMenuWidth])

  const handleOpen = useCallback(
    (text: string) => {
      if (typeof text === 'string') {
        dispatch(load(text))
        if (!isFullMenuWidth) {
          dispatch(closeMenu())
        }
      }
    },
    [dispatch, isFullMenuWidth],
  )

  const handleToggleAutoSave = useCallback(
    () => dispatch(toggleAutoSave(!autoSaveEnabled)),
    [dispatch, autoSaveEnabled],
  )

  return (
    <ToolbarComponent
      content={content}
      autoSaveEnabled={autoSaveEnabled}
      stats={stats}
      onToggleAutoSave={handleToggleAutoSave}
      onNew={handleNew}
      onOpen={handleOpen}
    />
  )
}

export default Toolbar
