// Cloud persistence middleware - RTK listener middleware configuration
// Orchestrates authentication and document synchronization
import debug from 'debug'

import {
  createListenerMiddleware,
  isAnyOf,
  ListenerEffectAPI,
} from '@reduxjs/toolkit'
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
  appInitialized,
  flushDocumentSave,
  flushAllDocumentSaves,
} from './cloudSlice'

// Import our manager classes
import { AuthManager } from './AuthManager'
import { DocumentSyncManager } from './DocumentSyncManager'
import { structuredTodosManager } from '../structuredTodos/persistenceMiddleware'
import { clearAllStructuredTodosData } from '../structuredTodos/structuredTodosSlice'
import { setText } from '../editor/editorSlice'
import { safeLocalStorage } from '../shared/storage'

const log = debug('cloudPersistenceMiddleware')

const CLOUD_ENABLED_KEY = 'cloud.enabled'

// Create singleton instances
const authManager = new AuthManager()
const documentSyncManager = new DocumentSyncManager()

// Main cloud listener middleware
export const cloudListenerMiddleware = createListenerMiddleware()

// === Authentication Listeners ===

/**
 * Helper function to ensure auth listener is attached when cloud is enabled
 */
const ensureAuthListener = async (
  _action: any,
  api: ListenerEffectAPI<any, any, any>,
) => {
  const state = api.getState()

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
}

// Initialize auth when app starts
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(appInitialized),
  effect: ensureAuthListener,
})

// Handle cloud sync enable/disable
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudEnabled),
  effect: async (action, api) => {
    const enabled = (action as unknown as { payload: boolean }).payload

    if (enabled) {
      safeLocalStorage.setItem(CLOUD_ENABLED_KEY, 'true')
      await ensureAuthListener(action, api)
    } else {
      safeLocalStorage.removeItem(CLOUD_ENABLED_KEY)

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

// Utility function to check if cloud sync is ready
const isCloudSyncReady = (state: any): boolean => {
  return (
    state.cloud.enabled &&
    state.cloud.status === 'connected' &&
    state.cloud.user?.uid
  )
}

// === Document Persistence Listeners ===

// Start document listeners when user connects
cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) =>
    !isCloudSyncReady(previousState) && isCloudSyncReady(currentState),
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
  predicate: (_action, currentState, previousState) =>
    isCloudSyncReady(previousState) && !isCloudSyncReady(currentState),
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

// Handle editor document changes
cloudListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Ignore setText actions that came from cloud
    if (
      ((action as any)?.type === 'editor/setText' ||
        (action as any)?.type === 'editor/setTextInternal') &&
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
    log('scheduleDocumentSave for editor', _action)
    const state: any = api.getState()

    if (!isCloudSyncReady(state)) return

    const userId = state.cloud.user.uid

    documentSyncManager.scheduleDocumentSave(
      userId,
      'editor',
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
      ((action as any)?.type === 'editor/setText' ||
        (action as any)?.type === 'editor/setTextInternal') &&
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
    log('scheduleDocumentSave for todo', _action)
    const state: any = api.getState()

    if (!isCloudSyncReady(state)) return

    const userId = state.cloud.user.uid

    documentSyncManager.scheduleDocumentSave(
      userId,
      'todo',
      api.getState,
      api.dispatch,
    )
  },
})

// Centralized flush handler for all lifecycle events
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(flushDocumentSave, flushAllDocumentSaves),
  effect: async (action, api) => {
    const state: any = api.getState()

    if (!isCloudSyncReady(state)) return

    const userId = state.cloud.user.uid

    if (action.type === flushDocumentSave.type) {
      const { mode } = (action as any).payload
      documentSyncManager.flushPendingSave(
        userId,
        mode,
        api.getState,
        api.dispatch,
      )
    } else {
      // flushAllDocumentSaves
      documentSyncManager.flushAllPendingSaves(
        userId,
        api.getState,
        api.dispatch,
      )
    }
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
      isUploading: false,
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
  return safeLocalStorage.getItem(CLOUD_ENABLED_KEY) === 'true'
}
