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

// Cloud sync UI status - simplified to 4 states
export type CloudSyncUiStatus =
  | 'disabled'
  | 'connected'
  | 'pending'
  | 'disconnected'

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
  [selectCloudEnabled, selectCloudStatus, selectCloudHasPendingWrites],
  (enabled, status, hasPending): CloudSyncUiStatus => {
    if (!enabled) return 'disabled'
    if (status !== 'connected') return 'disconnected'
    if (hasPending) return 'pending'
    return 'connected'
  },
)
