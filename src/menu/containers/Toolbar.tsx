import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { clear, load } from '../../editor/editorSlice'
import { closeMenu } from '../menuSlice'
import { openSettings } from '../../settings/settingsSlice'

import { useEditorText, useEditorContentStats } from '../../editor/hooks'
import { useFullMenuWidth } from '../../theme/hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
  const content = useEditorText()
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
      onOpenSettings={handleOpenSettings}
      onOpenAutoSaveSettings={handleOpenAutoSaveSettings}
      onOpenHotkeysSettings={handleOpenHotkeysSettings}
      onNew={handleNew}
      onOpen={handleOpen}
    />
  )
}

export default Toolbar
