import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { type Timestamp } from 'firebase/firestore'
import { getFirebase, type FirebaseUser } from './firebase'
import DiffMatchPatch from 'diff-match-patch'

import { type EditorState, setText } from '../editor/editorSlice'
import { type WritingMode } from '../mode/modeSlice'
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

type ModeDoc = {
  text: string
  updatedAt: Timestamp
  rev: number
}

type Unsubscribe = () => void

// Firestore helpers and paths
function docPathFor(userId: string, mode: WritingMode) {
  return `users/${userId}/doc/${mode}`
}

async function saveModeDocumentWithMerge(
  userId: string,
  mode: WritingMode,
  localText: string,
  baseRev: number,
  baseText: string,
  dispatch: (a: any) => void,
  getState: () => any,
) {
  const { db } = await getFirebase()
  const { doc, serverTimestamp, runTransaction, getDoc } = await import(
    'firebase/firestore'
  )
  const ref = doc(db, docPathFor(userId, mode))

  async function transactionalSave(
    expectedBaseRev: number,
    textToSave: string,
  ) {
    const newRev = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const remoteData = (snap.data() as Partial<ModeDoc> | undefined) ?? {}
      const remoteRev = typeof remoteData.rev === 'number' ? remoteData.rev : 0
      if (remoteRev !== expectedBaseRev) {
        throw new Error('conflict')
      }
      const nextRev = remoteRev + 1
      tx.set(
        ref,
        {
          text: textToSave,
          updatedAt: serverTimestamp(),
          rev: nextRev,
        },
        { merge: true },
      )
      return nextRev
    })
    return newRev
  }

  try {
    const newRev = await transactionalSave(baseRev, localText)
    dispatch(setCloudDocBase({ mode, baseRev: newRev, baseText: localText }))
    return
  } catch (err: any) {
    if ((err?.message ?? '') !== 'conflict') {
      throw err
    }
  }

  // Handle conflict with 3-way merge
  try {
    const remoteSnap = await getDoc(ref)
    const remoteData = remoteSnap.data() as Partial<ModeDoc> | undefined
    const remoteText =
      typeof remoteData?.text === 'string' ? remoteData!.text : ''
    const remoteRev = typeof remoteData?.rev === 'number' ? remoteData!.rev : 0

    const dmp = new DiffMatchPatch()
    const diffs = dmp.diff_main(baseText, localText)
    dmp.diff_cleanupSemantic(diffs)
    const patches = dmp.patch_make(baseText, diffs)
    const applyResult = dmp.patch_apply(patches, remoteText)
    const mergedText: string = applyResult[0]
    const results: boolean[] = applyResult[1]

    // If too many failures, prefer local text appended to remote as fallback
    const successRatio = results.length
      ? results.filter((b) => b).length / results.length
      : 1
    const textToSave = successRatio < 0.5 ? localText : mergedText

    // Try once more using the latest remoteRev
    const newRev = await transactionalSave(remoteRev, textToSave)
    dispatch(setCloudDocBase({ mode, baseRev: newRev, baseText: textToSave }))

    // Update local editor text to reflect merged resolution if it changed
    const state = getState() as any
    const localDoc = state.editor.documents[mode] as {
      text: string
      cursorPos: number
    }
    if (localDoc.text !== textToSave) {
      dispatch(
        setText({
          mode,
          text: textToSave,
          cursorPos: Math.min(localDoc.cursorPos, textToSave.length),
        }),
      )
    }
  } catch {
    dispatch(setCloudError('Failed to resolve edit conflict'))
  }
}

let authUnsubscribe: Unsubscribe | null = null
// reserved for future editor-level subscriptions (keep declared for potential cleanup semantics)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editorUnsubscribe: Unsubscribe | null = null
let snapshotUnsubscribes: Partial<Record<WritingMode, Unsubscribe>> = {}

// Debounce map per mode
const pendingTimers: Partial<Record<WritingMode, number>> = {}

const CLOUD_ENABLED_KEY = 'cloud.enabled'

export function hydrateCloudStateFromStorage(): {
  cloud: {
    enabled: boolean
    status: 'idle' | 'initializing' | 'connected' | 'error'
    user: null
    error?: string
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
} {
  try {
    const value = localStorage.getItem(CLOUD_ENABLED_KEY)
    return {
      cloud: {
        enabled: value === 'true',
        status: 'idle',
        user: null,
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
      } as any,
    }
  } catch {
    return {
      cloud: {
        enabled: false,
        status: 'idle',
        user: null,
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
      } as any,
    }
  }
}

export const cloudListenerMiddleware = createListenerMiddleware()

async function attachAuthListener(dispatch: (a: any) => void) {
  const { auth } = await getFirebase()
  const { onAuthStateChanged } = await import('firebase/auth')
  if (authUnsubscribe) {
    authUnsubscribe()
    authUnsubscribe = null
  }
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      dispatch(setCloudUser(serializeUser(user)))
      dispatch(setCloudStatus('connected'))
    } else {
      dispatch(setCloudUser(null))
      dispatch(setCloudStatus('idle'))
    }
  })
}

function serializeUser(user: FirebaseUser) {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
}

async function attachSnapshotListeners(
  userId: string,
  getState: () => any,
  dispatch: (a: any) => void,
) {
  const { db } = await getFirebase()
  const { doc, onSnapshot } = await import('firebase/firestore')

  ;(['editor', 'todo'] as WritingMode[]).forEach((mode) => {
    if (snapshotUnsubscribes[mode]) snapshotUnsubscribes[mode]!()
    const ref = doc(db, docPathFor(userId, mode))
    snapshotUnsubscribes[mode] = onSnapshot(ref, (snap) => {
      const meta = snap.metadata
      dispatch(
        setCloudDocSnapshotMeta({
          mode,
          hasPendingWrites: meta.hasPendingWrites,
          fromCache: meta.fromCache,
        }),
      )
      const data = snap.data() as
        | { text?: string; rev?: number; updatedAt?: unknown }
        | undefined
      if (!data || typeof data.text !== 'string') return
      const rev = typeof data.rev === 'number' ? data.rev : 0
      dispatch(setCloudDocBase({ mode, baseRev: rev, baseText: data.text }))
      const local = (getState().editor as EditorState).documents[mode]
      if (local.text !== data.text) {
        dispatch(
          setText({
            mode,
            text: data.text,
            cursorPos: Math.min(local.cursorPos, data.text.length),
          }),
        )
      }
    })
  })
}

// Attach auth listener when cloud is enabled
cloudListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Ignore cloud slice actions to prevent recursive triggering from within effects
    const actionType = (action as any)?.type
    if (typeof actionType === 'string' && actionType.startsWith('cloud/')) {
      return false
    }
    // Activate middleware only if cloud enabled
    const wasEnabled = (previousState as any)?.cloud?.enabled
    const isEnabled = (currentState as any).cloud?.enabled
    return Boolean(isEnabled || wasEnabled)
  },
  effect: async (_action, api) => {
    // On app init or any action, if cloud is enabled but auth listener
    // is not yet attached (e.g. page reload with enabled=true), attach it.
    const state: any = api.getState()
    if (!state?.cloud?.enabled) return
    if (authUnsubscribe) return
    if (state.cloud.status !== 'initializing') {
      api.dispatch(setCloudStatus('initializing'))
    }
    try {
      await attachAuthListener(api.dispatch)
    } catch {
      api.dispatch(setCloudError('Failed to initialize auth'))
      api.dispatch(setCloudStatus('error'))
    }
  },
})

// Enable/disable cloud sync toggling
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudEnabled),
  effect: async (action, api) => {
    const enabled = (action as unknown as { payload: boolean }).payload
    if (enabled) {
      api.dispatch(setCloudStatus('initializing'))
      try {
        try {
          localStorage.setItem(CLOUD_ENABLED_KEY, 'true')
        } catch {
          /* ignore */
        }
        await attachAuthListener(api.dispatch)
      } catch {
        api.dispatch(setCloudError('Failed to initialize auth'))
        api.dispatch(setCloudStatus('error'))
      }
    } else {
      try {
        localStorage.removeItem(CLOUD_ENABLED_KEY)
      } catch {
        /* ignore */
      }
      // Also sign out user when disabling cloud sync
      try {
        const { auth } = await getFirebase()
        const { signOut } = await import('firebase/auth')
        await signOut(auth)
      } catch {
        /* ignore */
      }
      if (authUnsubscribe) {
        authUnsubscribe()
        authUnsubscribe = null
      }
      Object.values(snapshotUnsubscribes).forEach((fn) => fn && fn())
      snapshotUnsubscribes = {}
      api.dispatch(setCloudUser(null))
      api.dispatch(setCloudStatus('idle'))
    }
  },
})

// Sign in with Google
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestGoogleSignIn),
  effect: async (_action, api) => {
    try {
      const { auth } = await getFirebase()
      const { GoogleAuthProvider, signInWithPopup } = await import(
        'firebase/auth'
      )
      // Ensure auth listener is attached so UI reflects auth changes immediately
      if (!authUnsubscribe) {
        await attachAuthListener(api.dispatch)
      }
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch {
      api.dispatch(setCloudError('Sign-in failed'))
    }
  },
})

// Delete user account and Firestore entries
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
      const { auth, db } = await getFirebase()
      const { deleteDoc, doc } = await import('firebase/firestore')

      // Delete editor docs
      await Promise.all(
        (['editor', 'todo'] as WritingMode[]).map((mode) =>
          deleteDoc(doc(db, docPathFor(userId, mode))),
        ),
      )

      // Delete user doc
      await deleteDoc(doc(db, 'users', userId))

      const { deleteUser, signOut } = await import('firebase/auth')
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          await deleteUser(auth.currentUser)
        } catch (err: any) {
          try {
            await signOut(auth)
          } catch {
            /* ignore */
          }
          api.dispatch(
            setCloudError(
              err?.code === 'auth/requires-recent-login'
                ? 'Please sign in again to delete your account'
                : 'Failed to delete account',
            ),
          )
          Object.values(snapshotUnsubscribes).forEach((fn) => fn && fn())
          snapshotUnsubscribes = {}
          api.dispatch(setCloudUser(null))
          api.dispatch(setCloudStatus('idle'))
          return
        }
      }

      try {
        const { signOut } = await import('firebase/auth')
        await signOut(auth)
      } catch {
        /* ignore */
      }
      Object.values(snapshotUnsubscribes).forEach((fn) => fn && fn())
      snapshotUnsubscribes = {}
      api.dispatch(setCloudUser(null))
      api.dispatch(setCloudStatus('idle'))
    } catch {
      api.dispatch(setCloudError('Failed to delete user'))
    }
  },
})

// Sign out user
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestSignOut),
  effect: async (_action, api) => {
    try {
      const { auth } = await getFirebase()
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
    } catch {
      api.dispatch(setCloudError('Sign-out failed'))
    }
  },
})

// Debounced writes to Firestore when editor text changes
cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    const curr: any = (currentState as any).editor
    const prev: any = (previousState as any)?.editor
    if (!curr || !prev) return false
    return (
      curr !== prev &&
      (curr.documents.editor.text !== prev.documents.editor.text ||
        curr.documents.todo.text !== prev.documents.todo.text)
    )
  },
  effect: async (_action, api) => {
    const state: any = api.getState() as any
    if (!state.cloud.enabled || state.cloud.status !== 'connected') return
    const userId = state.cloud.user?.uid
    if (!userId) return
    ;(['editor', 'todo'] as WritingMode[]).forEach((mode) => {
      const text = state.editor.documents[mode].text
      if (pendingTimers[mode]) window.clearTimeout(pendingTimers[mode])
      pendingTimers[mode] = window.setTimeout(async () => {
        try {
          const cloudDoc = (api.getState() as any).cloud.docs[mode] as {
            baseRev: number
            baseText: string
          }
          await saveModeDocumentWithMerge(
            userId,
            mode,
            text,
            cloudDoc.baseRev,
            cloudDoc.baseText,
            api.dispatch,
            api.getState,
          )
        } catch {
          api.dispatch(setCloudError('Failed to write to cloud'))
        }
      }, 1000)
    })
  },
})

// Start listening to Firestore snapshots once user is connected
cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    const curr: any = (currentState as any).cloud
    const prev: any = (previousState as any)?.cloud
    return (
      prev?.status !== 'connected' &&
      curr.status === 'connected' &&
      Boolean(curr.user)
    )
  },
  effect: async (_action, api) => {
    const state: any = api.getState() as any
    const userId = state.cloud.user?.uid
    if (!userId) return
    await attachSnapshotListeners(userId, api.getState, api.dispatch)
    try {
      const { db } = await getFirebase()
      const { doc, getDoc } = await import('firebase/firestore')
      ;(['editor', 'todo'] as WritingMode[]).forEach(async (mode) => {
        try {
          const ref = doc(db, docPathFor(userId, mode))
          const snap = await getDoc(ref)
          const remote = snap.data() as
            | { text?: string; rev?: number }
            | undefined
          const localText = (api.getState() as any).editor.documents[mode].text
          if (
            !remote ||
            typeof remote.text !== 'string' ||
            remote.text === ''
          ) {
            const base = (api.getState() as any).cloud.docs[mode]
            await saveModeDocumentWithMerge(
              userId,
              mode,
              localText,
              base.baseRev,
              base.baseText,
              api.dispatch,
              api.getState,
            )
          } else {
            const rev = typeof remote.rev === 'number' ? remote.rev : 0
            api.dispatch(
              setCloudDocBase({ mode, baseRev: rev, baseText: remote.text }),
            )
          }
        } catch {
          api.dispatch(setCloudError('Failed to perform initial sync'))
        }
      })
    } catch {
      api.dispatch(setCloudError('Failed to perform initial sync'))
    }
  },
})

// Cloud error logging
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudError),
  effect: async (action) => {
    const error = (action as unknown as { payload: string }).payload
    if (import.meta.env.DEV) {
      console.error('Cloud sync error:', error)
    }
  },
})
