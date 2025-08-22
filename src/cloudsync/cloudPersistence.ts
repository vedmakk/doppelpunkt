import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

import { getFirebase, type FirebaseUser } from './firebase'

import { type WritingMode } from '../mode/modeSlice'
import { setText } from '../editor/editorSlice'
import {
  requestGoogleSignIn,
  requestSignOut,
  requestDeleteUser,
  setCloudEnabled,
  setCloudError,
  setCloudStatus,
  setCloudUser,
  setCloudDocBase,
  setCloudDocSnapshotMeta,
} from './cloudSlice'

// Import our extracted modules
import {
  saveDocumentWithConflictResolution,
  deleteDocument,
  listenToDocument,
  getDocumentPath,
} from './documentPersistence'

const CLOUD_ENABLED_KEY = 'cloud.enabled'

// Authentication state management
class AuthManager {
  private authUnsubscribe: (() => void) | null = null

  async attachAuthListener(dispatch: (action: any) => void): Promise<void> {
    const { auth } = await getFirebase()
    const { onAuthStateChanged } = await import('firebase/auth')

    this.detachAuthListener()

    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setCloudUser(this.serializeUser(user)))
        dispatch(setCloudStatus('connected'))
      } else {
        dispatch(setCloudUser(null))
        dispatch(setCloudStatus('idle'))
      }
    })
  }

  detachAuthListener(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
      this.authUnsubscribe = null
    }
  }

  async signOut(): Promise<void> {
    const { auth } = await getFirebase()
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
  }

  async signInWithGoogle(): Promise<void> {
    const { auth } = await getFirebase()
    const { GoogleAuthProvider, signInWithPopup } = await import(
      'firebase/auth'
    )

    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async deleteCurrentUser(): Promise<string> {
    const { auth } = await getFirebase()
    const { deleteUser, signOut } = await import('firebase/auth')

    if (!auth.currentUser) {
      throw new Error('No signed-in user to delete')
    }

    const userId = auth.currentUser.uid

    try {
      await deleteUser(auth.currentUser)
      return userId
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        await signOut(auth)
        throw new Error('Please sign in again to delete your account')
      }
      throw error
    }
  }

  private serializeUser(user: FirebaseUser) {
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    }
  }
}

// Document synchronization management
class DocumentSyncManager {
  private documentListeners: Partial<Record<WritingMode, () => void>> = {}
  private saveTimers: Partial<Record<WritingMode, number>> = {}
  private readonly SAVE_DEBOUNCE_MS = 1000

  startListening(
    userId: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    this.stopListening()

    const modes: WritingMode[] = ['editor', 'todo']
    modes.forEach((mode) => {
      this.documentListeners[mode] = listenToDocument(
        userId,
        mode,
        (documentData, metadata) => {
          dispatch(
            setCloudDocSnapshotMeta({
              mode,
              hasPendingWrites: metadata.hasPendingWrites,
              fromCache: metadata.fromCache,
            }),
          )

          if (!documentData || typeof documentData.text !== 'string') {
            return
          }

          dispatch(
            setCloudDocBase({
              mode,
              baseRev: documentData.rev,
              baseText: documentData.text,
            }),
          )

          const localDocument = getState().editor.documents[mode]
          if (localDocument.text !== documentData.text) {
            dispatch(
              setText({
                mode,
                text: documentData.text,
                cursorPos: Math.min(
                  localDocument.cursorPos,
                  documentData.text.length,
                ),
              }),
            )
          }
        },
      )
    })
  }

  stopListening(): void {
    Object.values(this.documentListeners).forEach((unsubscribe) => {
      if (unsubscribe) unsubscribe()
    })
    this.documentListeners = {}
    this.clearAllSaveTimers()
  }

  async performInitialSync(
    userId: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): Promise<void> {
    const { db } = await getFirebase()
    const { doc, getDoc } = await import('firebase/firestore')

    const modes: WritingMode[] = ['editor', 'todo']

    await Promise.all(
      modes.map(async (mode) => {
        try {
          const ref = doc(db, getDocumentPath(userId, mode))
          const snap = await getDoc(ref)
          const remote = snap.data() as
            | { text?: string; rev?: number }
            | undefined
          const localText = getState().editor.documents[mode].text

          if (
            !remote ||
            typeof remote.text !== 'string' ||
            remote.text === ''
          ) {
            const base = getState().cloud.docs[mode]
            await this.saveDocument(
              userId,
              mode,
              localText,
              base.baseRev,
              base.baseText,
              dispatch,
              getState,
            )
          } else {
            const rev = typeof remote.rev === 'number' ? remote.rev : 0
            dispatch(
              setCloudDocBase({ mode, baseRev: rev, baseText: remote.text }),
            )
          }
        } catch {
          dispatch(setCloudError('Failed to perform initial sync'))
        }
      }),
    )
  }

  scheduleDocumentSave(
    userId: string,
    mode: WritingMode,
    text: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    if (this.saveTimers[mode]) {
      window.clearTimeout(this.saveTimers[mode])
    }

    this.saveTimers[mode] = window.setTimeout(async () => {
      try {
        const cloudDoc = getState().cloud.docs[mode]
        await this.saveDocument(
          userId,
          mode,
          text,
          cloudDoc.baseRev,
          cloudDoc.baseText,
          dispatch,
          getState,
        )
      } catch {
        dispatch(setCloudError('Failed to write to cloud'))
      }
    }, this.SAVE_DEBOUNCE_MS)
  }

  async deleteUserDocuments(userId: string): Promise<void> {
    const modes: WritingMode[] = ['editor', 'todo']

    await Promise.all([
      ...modes.map((mode) => deleteDocument(userId, mode)),
      this.deleteUserProfile(userId),
    ])
  }

  private async saveDocument(
    userId: string,
    mode: WritingMode,
    localText: string,
    baseRev: number,
    baseText: string,
    dispatch: (action: any) => void,
    getState: () => any,
  ): Promise<void> {
    const result = await saveDocumentWithConflictResolution(
      userId,
      mode,
      localText,
      baseRev,
      baseText,
    )

    dispatch(
      setCloudDocBase({
        mode,
        baseRev: result.newRevision,
        baseText: result.finalText,
      }),
    )

    if (result.wasConflicted && result.finalText !== localText) {
      const localDoc = getState().editor.documents[mode]
      dispatch(
        setText({
          mode,
          text: result.finalText,
          cursorPos: Math.min(localDoc.cursorPos, result.finalText.length),
        }),
      )
    }
  }

  private async deleteUserProfile(userId: string): Promise<void> {
    const { db } = await getFirebase()
    const { doc, deleteDoc } = await import('firebase/firestore')

    const userDocRef = doc(db, 'users', userId)
    await deleteDoc(userDocRef)
  }

  private clearAllSaveTimers(): void {
    Object.values(this.saveTimers).forEach((timer) => {
      if (timer) window.clearTimeout(timer)
    })
    this.saveTimers = {}
  }
}

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

    if (authManager['authUnsubscribe']) return

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
      if (!authManager['authUnsubscribe']) {
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

// Re-export cloud slice actions for convenience
export {
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
} from './cloudSlice'
