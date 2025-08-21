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
} from '../../cloudsync/hooks'
import {
  requestEmailLinkSignIn,
  requestGoogleSignIn,
  requestSignOut,
  setCloudEnabled,
} from '../../cloudsync/cloudSlice'
import { requestDeleteUser } from '../../cloudsync/cloudSlice'

const SettingsModal: React.FC = () => {
  const isOpen = useIsSettingsOpen()
  const shouldRender = useShouldRenderSettings()
  const activePage = useActiveSettingsPage()
  const autoSaveEnabled = useAutoSaveEnabled()
  const cloudEnabled = useCloudEnabled()
  const cloudUser = useCloudUser()
  const cloudStatus = useCloudStatus()

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

  const onSignInWithEmailLink = useCallback(
    (email: string) => dispatch(requestEmailLinkSignIn({ email })),
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
      onSignInWithEmailLink={onSignInWithEmailLink}
      onSignOut={onSignOut}
      onDeleteUser={onDeleteUser}
      cloudStatus={cloudStatus}
    />
  )
}

export default SettingsModal
