import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// WritingMode is not needed directly in reducers; keep slice decoupled

export interface CloudUserInfo {
  uid: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

export interface CloudState {
  enabled: boolean
  status: 'idle' | 'initializing' | 'connected' | 'error'
  user: CloudUserInfo | null
  error?: string
}

const initialState: CloudState = {
  enabled: false,
  status: 'idle',
  user: null,
  error: undefined,
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
    // UI intents that the middleware will handle
    requestGoogleSignIn: (state) => state,
    requestEmailLinkSignIn: (
      state,
      _action: PayloadAction<{ email: string }>,
    ) => {
      void _action
      return state
    },
    completeEmailLinkSignIn: (state) => state,
    requestSignOut: (state) => state,
    // Trigger sync for a specific mode (used by middleware internally)
    requestSync: (state) => state,
  },
})

export const cloudReducer = cloudSlice.reducer
export const {
  setCloudEnabled,
  setCloudStatus,
  setCloudUser,
  setCloudError,
  requestGoogleSignIn,
  requestEmailLinkSignIn,
  completeEmailLinkSignIn,
  requestSignOut,
  requestSync,
} = cloudSlice.actions
