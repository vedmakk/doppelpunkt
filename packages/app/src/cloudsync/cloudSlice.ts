import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type WritingMode } from '../mode/modeSlice'

export interface CloudUserInfo {
  uid: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

export type CloudStatus = 'idle' | 'initializing' | 'connected' | 'error'

export interface CloudState {
  enabled: boolean
  status: CloudStatus
  user: CloudUserInfo | null
  error?: string
  // Per-document sync metadata and optimistic concurrency base
  docs: Record<
    WritingMode,
    {
      baseRev: number
      baseText: string
      hasPendingWrites: boolean
      fromCache: boolean
    }
  >
}

const initialState: CloudState = {
  enabled: false,
  status: 'idle',
  user: null,
  error: undefined,
  docs: {
    editor: {
      baseRev: 0,
      baseText: '',
      hasPendingWrites: false,
      fromCache: false,
    },
    todo: {
      baseRev: 0,
      baseText: '',
      hasPendingWrites: false,
      fromCache: false,
    },
  },
}

const cloudSlice = createSlice({
  name: 'cloud',
  initialState,
  reducers: {
    setCloudEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload
    },
    setCloudStatus(state, action: PayloadAction<CloudState['status']>) {
      state.status = action.payload
    },
    setCloudUser(state, action: PayloadAction<CloudUserInfo | null>) {
      state.user = action.payload
    },
    setCloudError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload
    },
    setCloudDocBase(
      state,
      action: PayloadAction<{
        mode: WritingMode
        baseRev: number
        baseText: string
      }>,
    ) {
      const { mode, baseRev, baseText } = action.payload
      state.docs[mode].baseRev = baseRev
      state.docs[mode].baseText = baseText
    },
    setCloudDocSnapshotMeta(
      state,
      action: PayloadAction<{
        mode: WritingMode
        hasPendingWrites: boolean
        fromCache: boolean
      }>,
    ) {
      const { mode, hasPendingWrites, fromCache } = action.payload
      state.docs[mode].hasPendingWrites = hasPendingWrites
      state.docs[mode].fromCache = fromCache
    },
    // UI intents that the middleware will handle
    requestGoogleSignIn: (state) => state,
    requestSignOut: (state) => state,
    // Delete user account and associated data
    requestDeleteUser: (state) => state,
    // Trigger sync for a specific mode (used by middleware internally)
    requestSync: (state) => state,
    // Internal action to update text from cloud without triggering saves
    setTextFromCloud: (
      state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _action: PayloadAction<{
        mode: WritingMode
        text: string
        cursorPos: number
      }>,
    ) => state,
  },
})

export const cloudReducer = cloudSlice.reducer
export const {
  setCloudEnabled,
  setCloudStatus,
  setCloudUser,
  setCloudError,
  setCloudDocBase,
  setCloudDocSnapshotMeta,
  requestGoogleSignIn,
  requestSignOut,
  requestDeleteUser,
  requestSync,
  setTextFromCloud,
} = cloudSlice.actions
