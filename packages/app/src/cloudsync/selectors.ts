import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'
import { selectRawEditorText } from '../editor/selectors'
import { selectWritingMode } from '../mode/selectors'

export const selectCloudState = (s: RootState) => s.cloud

export const selectCloudEnabled = createSelector(
  selectCloudState,
  (s) => s.enabled,
)

export const selectCloudStatus = createSelector(
  selectCloudState,
  (s) => s.status,
)

export const selectCloudIsUploading = createSelector(
  selectCloudState,
  (s) => s.isUploading,
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
  | 'pending'
  | 'syncing'
  | 'offline'
  | 'synced'

const selectCurrentCloudDocMeta = createSelector(
  selectWritingMode,
  selectCloudDocMetas,
  (mode, docs) => docs[mode],
)

// Derived selectors for sync status indicators
export const selectCloudHasPendingWrites = createSelector(
  selectCloudDocMetas,
  selectCurrentCloudDocMeta,
  selectRawEditorText,
  (docs, docMeta, currentText) =>
    docs.editor.hasPendingWrites ||
    docs.todo.hasPendingWrites ||
    docMeta.baseText !== currentText,
)

export const selectCloudIsFromCache = createSelector(
  selectCloudDocMetas,
  (docs) => docs.editor.fromCache || docs.todo.fromCache,
)

export const selectCloudSyncStatus = createSelector(
  [
    selectCloudEnabled,
    selectCloudStatus,
    selectCloudIsUploading,
    selectCloudError,
    selectCloudHasPendingWrites,
    selectCloudIsFromCache,
  ],
  (
    enabled,
    status,
    isUploading,
    error,
    hasPending,
    fromCache,
  ): CloudSyncUiStatus => {
    if (!enabled) return 'disabled'
    if (status === 'initializing') return 'initializing'
    if (error) return 'error'
    if (isUploading) return 'syncing'
    if (status !== 'connected') return 'disconnected'
    if (hasPending) return 'pending'
    if (fromCache && hasPending) return 'offline'
    return 'synced'
  },
)
