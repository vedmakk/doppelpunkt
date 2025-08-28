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

// Cloud sync UI status enum for consistent status representation
export type CloudSyncUiStatus =
  | 'disabled'
  | 'initializing'
  | 'error'
  | 'disconnected'
  | 'syncing'
  | 'offline'
  | 'synced'

// Derived selectors for sync status indicators
export const selectCloudHasPendingWrites = createSelector(
  selectCloudDocMetas,
  (docs) => docs.editor.hasPendingWrites || docs.todo.hasPendingWrites,
)

export const selectCloudIsFromCache = createSelector(
  selectCloudDocMetas,
  (docs) => docs.editor.fromCache || docs.todo.fromCache,
)

export const selectCloudSyncStatus = createSelector(
  [
    selectCloudEnabled,
    selectCloudStatus,
    selectCloudError,
    selectCloudHasPendingWrites,
    selectCloudIsFromCache,
  ],
  (enabled, status, error, hasPending, fromCache): CloudSyncUiStatus => {
    if (!enabled) return 'disabled'
    if (status === 'initializing') return 'initializing'
    if (error) return 'error'
    if (status !== 'connected') return 'disconnected'
    if (hasPending) return 'syncing'
    if (fromCache) return 'offline'
    return 'synced'
  },
)

export const selectCloudSyncStatusText = createSelector(
  selectCloudSyncStatus,
  (status): string => {
    switch (status) {
      case 'disabled':
        return 'Disabled'
      case 'initializing':
        return 'Connecting…'
      case 'error':
        return 'Error'
      case 'disconnected':
        return 'Disconnected'
      case 'syncing':
        return 'Syncing…'
      case 'offline':
        return 'Offline'
      case 'synced':
        return 'Synced'
      default:
        return 'Unknown'
    }
  },
)
