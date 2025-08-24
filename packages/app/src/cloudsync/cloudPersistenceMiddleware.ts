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
  setTextFromCloud,
} from './cloudSlice'

// Import our manager classes
import { AuthManager } from './AuthManager'
import { DocumentSyncManager } from './DocumentSyncManager'
import { structuredTodosManager } from '../structuredTodos/persistenceMiddleware'
import { clearAllStructuredTodosData } from '../structuredTodos/structuredTodosSlice'
import { setText } from '../editor/editorSlice'

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
      // Delete all user data from Firestore
      await Promise.all([
        documentSyncManager.deleteUserDocuments(userId),
        structuredTodosManager.deleteUserData(userId),
      ])

      // Delete the user account
      await authManager.deleteCurrentUser()

      // Clean up listeners and state
      authManager.detachAuthListener()
      documentSyncManager.stopListening()
      structuredTodosManager.stopListening()
      api.dispatch(setCloudUser(null))
      api.dispatch(setCloudStatus('idle'))
      api.dispatch(clearAllStructuredTodosData())
    } catch (error: any) {
      const errorMessage = error.message.includes('sign in again')
        ? error.message
        : 'Failed to delete account'

      api.dispatch(setCloudError(errorMessage))

      if (error.message.includes('sign in again')) {
        authManager.detachAuthListener()
        documentSyncManager.stopListening()
        structuredTodosManager.stopListening()
        api.dispatch(setCloudUser(null))
        api.dispatch(setCloudStatus('idle'))
        api.dispatch(clearAllStructuredTodosData())
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

    // Perform initial sync to write local documents to cloud if they don't exist
    try {
      await documentSyncManager.initialSync(userId, api.getState, api.dispatch)
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

// Handle setTextFromCloud actions by updating the editor
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setTextFromCloud),
  effect: async (action, api) => {
    const { mode, text, cursorPos } = (action as any).payload
    // Add metadata to indicate this setText came from cloud
    const setTextAction = setText({ mode, text, cursorPos })
    ;(setTextAction as any).meta = { fromCloud: true }
    api.dispatch(setTextAction)
  },
})

// === Document Change Listeners ===

// Utility function to check if cloud sync is ready
const isCloudSyncReady = (state: any): boolean => {
  return (
    state.cloud.enabled &&
    state.cloud.status === 'connected' &&
    state.cloud.user?.uid
  )
}

// Handle editor document changes
cloudListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Ignore setText actions that came from cloud
    if (
      (action as any)?.type === 'editor/setText' &&
      (action as any)?.meta?.fromCloud
    ) {
      return false
    }

    const current: any = currentState
    const previous: any = previousState

    if (!current.editor || !previous?.editor) return false

    // Only trigger when editor document text changes
    return (
      current.editor.documents.editor.text !==
      previous.editor.documents.editor.text
    )
  },
  effect: async (_action, api) => {
    const state: any = api.getState()

    if (!isCloudSyncReady(state)) return

    const userId = state.cloud.user.uid
    const text = state.editor.documents.editor.text

    documentSyncManager.scheduleDocumentSave(
      userId,
      'editor',
      text,
      api.getState,
      api.dispatch,
    )
  },
})

// Handle todo document changes
cloudListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Ignore setText actions that came from cloud
    if (
      (action as any)?.type === 'editor/setText' &&
      (action as any)?.meta?.fromCloud
    ) {
      return false
    }

    const current: any = currentState
    const previous: any = previousState

    if (!current.editor || !previous?.editor) return false

    // Only trigger when todo document text changes
    return (
      current.editor.documents.todo.text !== previous.editor.documents.todo.text
    )
  },
  effect: async (_action, api) => {
    const state: any = api.getState()

    if (!isCloudSyncReady(state)) return

    const userId = state.cloud.user.uid
    const text = state.editor.documents.todo.text

    documentSyncManager.scheduleDocumentSave(
      userId,
      'todo',
      text,
      api.getState,
      api.dispatch,
    )
  },
})

// Error logging middleware
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudError),
  effect: async (action) => {
    const error = (action as any).payload
    if (import.meta.env.DEV && error) {
      console.error('Cloud sync error:', error)
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
