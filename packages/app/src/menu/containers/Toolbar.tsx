import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { openSettings } from '../../settings/settingsSlice'

import { useWritingMode } from '../../mode/hooks'
import { useCloudSyncStatusText } from '../../cloudsync/hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
  const mode = useWritingMode()
  const cloudSyncStatusText = useCloudSyncStatusText()

  const dispatch = useDispatch()

  const handleOpenSettings = useCallback(
    () => dispatch(openSettings({ page: 'general' })),
    [dispatch],
  )
  const handleOpenAutoSaveSettings = useCallback(
    () => dispatch(openSettings({ page: 'general', section: 'autoSave' })),
    [dispatch],
  )
  const handleOpenCloudSyncSettings = useCallback(
    () => dispatch(openSettings({ page: 'general', section: 'cloudSync' })),
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
      onOpenCloudSyncSettings={handleOpenCloudSyncSettings}
      onOpenHotkeysSettings={handleOpenHotkeysSettings}
      cloudSyncStatusText={cloudSyncStatusText}
    />
  )
}

export default Toolbar
