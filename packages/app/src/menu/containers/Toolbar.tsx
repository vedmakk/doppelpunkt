import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { openSettings } from '../../settings/settingsSlice'

import { useWritingMode } from '../../mode/hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
  const mode = useWritingMode()

  const dispatch = useDispatch()

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
      mode={mode}
      onOpenSettings={handleOpenSettings}
      onOpenAutoSaveSettings={handleOpenAutoSaveSettings}
      onOpenHotkeysSettings={handleOpenHotkeysSettings}
    />
  )
}

export default Toolbar
