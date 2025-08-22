import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'

export const selectCloudState = (s: RootState) => s.cloud

export const selectCloudEnabled = createSelector(
  selectCloudState,
  (s) => s.enabled,
)

export const selectCloudStatus = createSelector(
  selectCloudState,
  (s) => s.status,
)

export const selectCloudUser = createSelector(selectCloudState, (s) => s.user)

export const selectCloudError = createSelector(selectCloudState, (s) => s.error)

export const selectCloudDocMetas = createSelector(
  selectCloudState,
  (s) => s.docs,
)

export const selectCloudSyncStatusText = createSelector(
  [
    selectCloudEnabled,
    selectCloudStatus,
    selectCloudDocMetas,
    selectCloudError,
  ],
  (enabled, status, docs, error): string => {
    if (!enabled) return 'Disabled'
    if (status === 'initializing') return 'Connecting…'
    if (status === 'error') return 'Error'
    if (status !== 'connected') return 'Disconnected'

    const anyPending =
      docs.editor.hasPendingWrites || docs.todo.hasPendingWrites
    if (anyPending) return 'Syncing…'
    const allFromCache = docs.editor.fromCache && docs.todo.fromCache
    if (allFromCache) return 'Offline'

    if (error) return 'Error'

    return 'Synced'
  },
)
