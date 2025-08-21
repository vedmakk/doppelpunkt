import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { type EditorState, setText } from '../editor/editorSlice'
import { type WritingMode } from '../mode/modeSlice'
import {
  completeEmailLinkSignIn,
  requestEmailLinkSignIn,
  requestGoogleSignIn,
  requestSignOut,
  setCloudEnabled,
  setCloudError,
  setCloudStatus,
  setCloudUser,
} from './cloudSlice'
import { getFirebase, type FirebaseUser } from './firebase'

// Firestore helpers and paths
function docPathFor(userId: string, mode: WritingMode) {
  return `users/${userId}/doc/${mode}`
}

async function writeModeDocument(
  userId: string,
  mode: WritingMode,
  text: string,
  version?: number,
) {
  const { db } = await getFirebase()
  const { doc, serverTimestamp, setDoc } = await import('firebase/firestore')

  const docRef = doc(db, docPathFor(userId, mode))
  await setDoc(
    docRef,
    {
      text,
      updatedAt: serverTimestamp(),
      version: (version ?? 0) + 1,
    },
    { merge: true },
  )
}

type Unsubscribe = () => void

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
  }
} {
  try {
    const value = localStorage.getItem(CLOUD_ENABLED_KEY)
    return {
      cloud: { enabled: value === 'true', status: 'idle', user: null } as any,
    }
  } catch {
    return { cloud: { enabled: false, status: 'idle', user: null } as any }
  }
}

export const cloudListenerMiddleware = createListenerMiddleware()

async function attachAuthListener(dispatch: (a: any) => void) {
  const { auth } = await getFirebase()
  const { onAuthStateChanged } = await import('firebase/auth')
  if (authUnsubscribe) authUnsubscribe()
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
      const data = snap.data() as
        | { text?: string; version?: number; updatedAt?: unknown }
        | undefined
      if (!data || typeof data.text !== 'string') return
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

cloudListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    // Activate middleware only if cloud enabled
    const wasEnabled = (previousState as any)?.cloud?.enabled
    const isEnabled = (currentState as any).cloud?.enabled
    return Boolean(isEnabled || wasEnabled)
  },
  effect: async () => {},
})

// Enable/disable toggling
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
        // If user opened via email link, complete sign-in
        try {
          const { auth } = await getFirebase()
          const { isSignInWithEmailLink } = await import('firebase/auth')
          if (isSignInWithEmailLink(auth, window.location.href)) {
            api.dispatch(completeEmailLinkSignIn())
          }
        } catch {
          /* ignore */
        }
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
      if (authUnsubscribe) authUnsubscribe()
      Object.values(snapshotUnsubscribes).forEach((fn) => fn && fn())
      snapshotUnsubscribes = {}
      api.dispatch(setCloudUser(null))
      api.dispatch(setCloudStatus('idle'))
    }
  },
})

// Auth flows
cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestGoogleSignIn),
  effect: async (_action, api) => {
    try {
      const { auth } = await getFirebase()
      const { GoogleAuthProvider, signInWithPopup } = await import(
        'firebase/auth'
      )
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch {
      api.dispatch(setCloudError('Sign-in failed'))
    }
  },
})

cloudListenerMiddleware.startListening({
  matcher: isAnyOf(requestEmailLinkSignIn),
  effect: async (action, api) => {
    try {
      const { auth } = await getFirebase()
      const { sendSignInLinkToEmail, isSignInWithEmailLink } = await import(
        'firebase/auth'
      )
      const email = (action as unknown as { payload: { email: string } })
        .payload.email
      const url = window.location.href
      await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true })
      window.localStorage.setItem('cloud.emailForSignIn', email)
      // If user clicks link and returns, the app should call completeEmailLinkSignIn
      if (isSignInWithEmailLink(auth, window.location.href)) {
        api.dispatch(completeEmailLinkSignIn())
      }
    } catch {
      api.dispatch(setCloudError('Email link sign-in failed'))
    }
  },
})

cloudListenerMiddleware.startListening({
  matcher: isAnyOf(completeEmailLinkSignIn),
  effect: async (_action, api) => {
    try {
      const { auth } = await getFirebase()
      const { isSignInWithEmailLink, signInWithEmailLink } = await import(
        'firebase/auth'
      )
      if (!isSignInWithEmailLink(auth, window.location.href)) return
      const email = window.localStorage.getItem('cloud.emailForSignIn')
      if (!email) return
      await signInWithEmailLink(auth, email, window.location.href)
      window.localStorage.removeItem('cloud.emailForSignIn')
    } catch {
      api.dispatch(setCloudError('Completing email link sign-in failed'))
    }
  },
})

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
          await writeModeDocument(userId, mode, text)
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
  },
})
