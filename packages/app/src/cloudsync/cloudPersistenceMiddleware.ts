// Cloud persistence middleware - RTK listener middleware configuration
// Orchestrates authentication and document synchronization

import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { type WritingMode } from '../mode/modeSlice'
import {
  requestGoogleSignIn,
  requestSignOut,
  requestDeleteUser,
  setCloudEnabled,
  setCloudError,
  setCloudStatus,
  setCloudUser,
} from './cloudSlice'

// Import our manager classes
import { AuthManager } from './AuthManager'
import { DocumentSyncManager } from './DocumentSyncManager'
import { isAnyOf as isAnyOfRTK } from '@reduxjs/toolkit'
import {
  setStructuredEnabled,
  setStructuredApiKey,
  requestSaveStructuredConfig,
} from '../structured/structuredSlice'

const CLOUD_ENABLED_KEY = 'cloud.enabled'

// Create singleton instances
const authManager = new AuthManager()
const documentSyncManager = new DocumentSyncManager()

// Main cloud listener middleware
export const cloudListenerMiddleware = createListenerMiddleware()

// === Authentication Listeners ===

// Initialize auth when cloud is enabled
cloudListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    const actionType = (action as any)?.type
    if (typeof actionType === 'string' && actionType.startsWith('cloud/')) {
      return false
    }

    const wasEnabled = (previousState as any)?.cloud?.enabled
    const isEnabled = (currentState as any).cloud?.enabled
    return Boolean(isEnabled || wasEnabled)
  },
  effect: async (_action, api) => {
    const state: any = api.getState()
    if (!state?.cloud?.enabled) return

    if (authManager.isListenerAttached()) return

    if (state.cloud.status !== 'initializing') {
      api.dispatch(setCloudStatus('initializing'))
    }

    try {
      await authManager.attachAuthListener(api.dispatch)
    } catch {
      api.dispatch(setCloudError('Failed to initialize auth'))
      api.dispatch(setCloudStatus('error'))
    }
  },
})

// Handle cloud sync enable/disable
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudEnabled),
  effect: async (action, api) => {
    const enabled = (action as unknown as { payload: boolean }).payload

    if (enabled) {
      api.dispatch(setCloudStatus('initializing'))

      try {
        localStorage.setItem(CLOUD_ENABLED_KEY, 'true')
      } catch {
        // Ignore localStorage errors
      }

      try {
        await authManager.attachAuthListener(api.dispatch)
      } catch {
        api.dispatch(setCloudError('Failed to initialize auth'))
        api.dispatch(setCloudStatus('error'))
      }
    } else {
      try {
        localStorage.removeItem(CLOUD_ENABLED_KEY)
      } catch {
        // Ignore localStorage errors
      }

      try {
        await authManager.signOut()
      } catch {
        // Ignore sign-out errors during disable
      }

      authManager.detachAuthListener()
      documentSyncManager.stopListening()
      api.dispatch(setCloudUser(null))
      api.dispatch(setCloudStatus('idle'))
    }
  },
})

// Handle Google sign-in requests
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestGoogleSignIn),
  effect: async (_action, api) => {
    try {
      if (!authManager.isListenerAttached()) {
        await authManager.attachAuthListener(api.dispatch)
      }

      await authManager.signInWithGoogle()
    } catch {
      api.dispatch(setCloudError('Sign-in failed'))
    }
  },
})

// Handle sign-out requests
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestSignOut),
  effect: async (_action, api) => {
    try {
      await authManager.signOut()
    } catch {
      api.dispatch(setCloudError('Sign-out failed'))
    }
  },
})

// Handle user deletion requests
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestDeleteUser),
  effect: async (_action, api) => {
    const state: any = api.getState()
    const userId = state?.cloud?.user?.uid

    if (!userId) {
      api.dispatch(setCloudError('No signed-in user to delete'))
      return
    }

    try {
      await documentSyncManager.deleteUserDocuments(userId)
      await authManager.deleteCurrentUser()

      authManager.detachAuthListener()
      documentSyncManager.stopListening()
      api.dispatch(setCloudUser(null))
      api.dispatch(setCloudStatus('idle'))
    } catch (error: any) {
      const errorMessage = error.message.includes('sign in again')
        ? error.message
        : 'Failed to delete account'

      api.dispatch(setCloudError(errorMessage))

      if (error.message.includes('sign in again')) {
        authManager.detachAuthListener()
        documentSyncManager.stopListening()
        api.dispatch(setCloudUser(null))
        api.dispatch(setCloudStatus('idle'))
      }
    }
  },
})

// === Document Persistence Listeners ===

// Start document listeners when user connects
cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    const current: any = currentState
    const previous: any = previousState

    return (
      previous?.cloud?.status !== 'connected' &&
      current.cloud.status === 'connected' &&
      Boolean(current.cloud.user)
    )
  },
  effect: async (_action, api) => {
    const state: any = api.getState()
    const userId = state.cloud.user?.uid

    if (!userId) return

    documentSyncManager.startListening(userId, api.getState, api.dispatch)

    try {
      await documentSyncManager.performInitialSync(
        userId,
        api.getState,
        api.dispatch,
      )
    } catch {
      api.dispatch(setCloudError('Failed to perform initial sync'))
    }
  },
})

// Stop document listeners when user disconnects
cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    const current: any = currentState
    const previous: any = previousState

    return (
      previous?.cloud?.status === 'connected' &&
      current.cloud.status !== 'connected'
    )
  },
  effect: async () => {
    documentSyncManager.stopListening()
  },
})

// Handle document changes with debounced saves
cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    const current: any = currentState
    const previous: any = previousState

    if (!current.editor || !previous?.editor) return false

    return (
      current.editor.documents.editor.text !==
        previous.editor.documents.editor.text ||
      current.editor.documents.todo.text !== previous.editor.documents.todo.text
    )
  },
  effect: async (_action, api) => {
    const state: any = api.getState()

    if (!state.cloud.enabled || state.cloud.status !== 'connected') return

    const userId = state.cloud.user?.uid
    if (!userId) return

    const modes: WritingMode[] = ['editor', 'todo']

    modes.forEach((mode) => {
      const text = state.editor.documents[mode].text
      documentSyncManager.scheduleDocumentSave(
        userId,
        mode,
        text,
        api.getState,
        api.dispatch,
      )
    })
  },
})

// Error logging middleware
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudError),
  effect: async (action) => {
    const error = (action as any).payload
    if (import.meta.env.DEV) {
      console.error('Cloud sync error:', error)
    }
  },
})

// === Structured Todos: sync user config to Firestore ===
cloudListenerMiddleware.startListening({
  matcher: isAnyOfRTK(
    setStructuredEnabled,
    setStructuredApiKey,
    requestSaveStructuredConfig,
  ),
  effect: async (_action, api) => {
    const state: any = api.getState()
    if (!state.cloud.enabled || state.cloud.status !== 'connected') return
    const userId = state.cloud.user?.uid
    if (!userId) return

    try {
      const { db } = await (await import('./firebase')).getFirebase()
      const { doc, setDoc } = await import('firebase/firestore')
      const ref = doc(db, 'users', userId, 'meta', 'config')
      await setDoc(
        ref,
        {
          structuredEnabled: Boolean(state.structured.enabled),
          openaiApiKey: state.structured.apiKey ?? null,
        },
        { merge: true },
      )
    } catch {
      // silent
      // TODO: Handle error
    }
  },
})

// === Utility Functions ===

/**
 * Hydrates the cloud state from localStorage
 */
export function hydrateCloudStateFromStorage() {
  const enabled = getCloudEnabledFromStorage()

  return {
    cloud: {
      enabled,
      status: 'idle' as const,
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
      } as Record<
        WritingMode,
        {
          baseRev: number
          baseText: string
          hasPendingWrites: boolean
          fromCache: boolean
        }
      >,
    },
  }
}

function getCloudEnabledFromStorage(): boolean {
  try {
    return localStorage.getItem(CLOUD_ENABLED_KEY) === 'true'
  } catch {
    return false
  }
}
