import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import SettingsModalComponent from '../components/SettingsModal'
import { useActiveSettingsPage, useIsSettingsOpen } from '../hooks'
import { closeSettings, setActivePage, SettingsPage } from '../settingsSlice'

import { useAutoSaveEnabled } from '../../editor/hooks'
import { toggleAutoSave } from '../../editor/editorSlice'

const SettingsModal: React.FC = () => {
  const isOpen = useIsSettingsOpen()
  const activePage = useActiveSettingsPage()
  const autoSaveEnabled = useAutoSaveEnabled()

  const dispatch = useDispatch()

  const onClose = useCallback(() => dispatch(closeSettings()), [dispatch])
  const onChangePage = useCallback(
    (page: SettingsPage) => dispatch(setActivePage(page)),
    [dispatch],
  )
  const onToggleAutoSave = useCallback(
    () => dispatch(toggleAutoSave(!autoSaveEnabled)),
    [dispatch, autoSaveEnabled],
  )

  return (
    <SettingsModalComponent
      isOpen={isOpen}
      activePage={activePage}
      onClose={onClose}
      onChangePage={onChangePage}
      autoSaveEnabled={autoSaveEnabled}
      onToggleAutoSave={onToggleAutoSave}
    />
  )
}

export default SettingsModal
