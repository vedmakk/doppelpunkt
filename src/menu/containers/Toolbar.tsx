import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { clear, load } from '../../editor/editorSlice'
import { closeMenu } from '../menuSlice'
import { openSettings } from '../../settings/settingsSlice'

import { useEditorText, useEditorContentStats } from '../../editor/hooks'
import { useWritingMode } from '../../mode/hooks'
import { useFullMenuWidth } from '../../theme/hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
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

  const handleOpenSettings = useCallback(
    () => dispatch(openSettings({ page: 'general' })),
    [dispatch],
  )
  const handleOpenAutoSaveSettings = useCallback(
    () => dispatch(openSettings({ page: 'general', section: 'autoSave' })),
    [dispatch],
  )
  const handleOpenHotkeysSettings = useCallback(
    () => dispatch(openSettings({ page: 'hotkeys' })),
    [dispatch],
  )

  return (
    <ToolbarComponent
      content={content}
      stats={stats}
      mode={mode}
      onOpenSettings={handleOpenSettings}
      onOpenAutoSaveSettings={handleOpenAutoSaveSettings}
      onOpenHotkeysSettings={handleOpenHotkeysSettings}
      onNew={handleNew}
      onOpen={handleOpen}
    />
  )
}

export default Toolbar
