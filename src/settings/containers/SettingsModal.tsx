import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import SettingsModalComponent from '../components/SettingsModal'
import {
  useActiveSettingsPage,
  useIsSettingsOpen,
  useShouldRenderSettings,
} from '../hooks'
import {
  closeSettings,
  setActivePage,
  setShouldRender,
  SettingsPage,
} from '../settingsSlice'

import { useAutoSaveEnabled } from '../../editor/hooks'
import { toggleAutoSave } from '../../editor/editorSlice'

const SettingsModal: React.FC = () => {
  const isOpen = useIsSettingsOpen()
  const shouldRender = useShouldRenderSettings()
  const activePage = useActiveSettingsPage()
  const autoSaveEnabled = useAutoSaveEnabled()

  const dispatch = useDispatch()

  const onClose = useCallback(() => dispatch(closeSettings()), [dispatch])

  const setShouldRenderSettings = useCallback(
    (shouldRender: boolean) => {
      dispatch(setShouldRender(shouldRender))
    },
    [dispatch],
  )

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
      shouldRender={shouldRender}
      setShouldRender={setShouldRenderSettings}
      activePage={activePage}
      onClose={onClose}
      onChangePage={onChangePage}
      autoSaveEnabled={autoSaveEnabled}
      onToggleAutoSave={onToggleAutoSave}
    />
  )
}

export default SettingsModal
