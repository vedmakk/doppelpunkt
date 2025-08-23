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
import {
  useCloudEnabled,
  useCloudStatus,
  useCloudUser,
  useCloudSyncStatusText,
} from '../../cloudsync/hooks'
import {
  requestGoogleSignIn,
  requestSignOut,
  setCloudEnabled,
} from '../../cloudsync/cloudSlice'
import { requestDeleteUser } from '../../cloudsync/cloudSlice'
import { useStructuredTodos } from '../../structuredTodos/hooks'

const SettingsModal: React.FC = () => {
  const isOpen = useIsSettingsOpen()
  const shouldRender = useShouldRenderSettings()
  const activePage = useActiveSettingsPage()
  const autoSaveEnabled = useAutoSaveEnabled()
  const cloudEnabled = useCloudEnabled()
  const cloudUser = useCloudUser()
  const cloudStatus = useCloudStatus()
  const cloudSyncStatusText = useCloudSyncStatusText()

  const {
    enabled: structuredTodosEnabled,
    apiKeyIsSet: structuredTodosApiKeyIsSet,
    toggleEnabled: toggleStructuredTodos,
    updateApiKey,
    clearKey: clearApiKey,
  } = useStructuredTodos()

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

  const onToggleCloud = useCallback(
    () => dispatch(setCloudEnabled(!cloudEnabled)),
    [dispatch, cloudEnabled],
  )

  const onSignInWithGoogle = useCallback(
    () => dispatch(requestGoogleSignIn()),
    [dispatch],
  )

  const onSignOut = useCallback(() => dispatch(requestSignOut()), [dispatch])

  const onDeleteUser = useCallback(
    () => dispatch(requestDeleteUser()),
    [dispatch],
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
      cloudEnabled={cloudEnabled}
      onToggleCloud={onToggleCloud}
      cloudUser={cloudUser}
      onSignInWithGoogle={onSignInWithGoogle}
      onSignOut={onSignOut}
      onDeleteUser={onDeleteUser}
      cloudStatus={cloudStatus}
      cloudSyncStatusText={cloudSyncStatusText}
      structuredTodosEnabled={structuredTodosEnabled}
      onToggleStructuredTodos={toggleStructuredTodos}
      structuredTodosApiKeyIsSet={structuredTodosApiKeyIsSet}
      onUpdateApiKey={updateApiKey}
      onClearApiKey={clearApiKey}
    />
  )
}

export default SettingsModal
