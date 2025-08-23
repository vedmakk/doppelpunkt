import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setStructuredTodos,
  clearStructuredTodos,
} from './structuredTodosSlice'
import { getFirebase } from '../cloudsync/firebase'
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore'
import {
  StructuredTodo,
  StructuredTodosSettings,
  StructuredTodosState,
} from './types'

const STRUCTURED_TODOS_KEY = 'structuredTodos'
const STRUCTURED_TODOS_ENABLED_KEY = `${STRUCTURED_TODOS_KEY}.enabled`
const STRUCTURED_TODOS_ITEMS_KEY = `${STRUCTURED_TODOS_KEY}.items`

export const structuredTodosStorageKeys = {
  STRUCTURED_TODOS_ENABLED_KEY,
  STRUCTURED_TODOS_ITEMS_KEY,
}

export function hydrateStructuredTodosStateFromStorage(): {
  structuredTodos: StructuredTodosState
} {
  try {
    const enabled =
      localStorage.getItem(STRUCTURED_TODOS_ENABLED_KEY) === 'true'
    const storedTodos = localStorage.getItem(STRUCTURED_TODOS_ITEMS_KEY)
    const todos = storedTodos ? JSON.parse(storedTodos) : []

    const structuredTodos: StructuredTodosState = {
      todos,
      enabled,
      apiKey: null, // Never loaded from storage (write-only)
      isProcessing: false,
      error: undefined,
    }

    return { structuredTodos }
  } catch {
    // In non-browser or restricted environments, fall back to defaults
    const structuredTodos: StructuredTodosState = {
      todos: [],
      enabled: false,
      apiKey: null,
      isProcessing: false,
      error: undefined,
    }
    return { structuredTodos }
  }
}

export const structuredTodosListenerMiddleware = createListenerMiddleware()

// Listen for local state changes and persist to localStorage
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(
    setStructuredTodosEnabled,
    setStructuredTodos,
    clearStructuredTodos,
  ),
  effect: async (_action, listenerApi) => {
    const state: any = listenerApi.getState()
    try {
      // Persist enabled state
      if (state.structuredTodos.enabled) {
        localStorage.setItem(STRUCTURED_TODOS_ENABLED_KEY, 'true')
      } else {
        localStorage.removeItem(STRUCTURED_TODOS_ENABLED_KEY)
      }

      // Persist todos
      if (state.structuredTodos.todos.length > 0) {
        localStorage.setItem(
          STRUCTURED_TODOS_ITEMS_KEY,
          JSON.stringify(state.structuredTodos.todos),
        )
      } else {
        localStorage.removeItem(STRUCTURED_TODOS_ITEMS_KEY)
      }
    } catch {
      // Ignore storage failures
    }
  },
})

// Listen for settings changes and sync to Firestore
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setStructuredTodosEnabled, setApiKey, clearApiKey),
  effect: async (action, listenerApi) => {
    const state: any = listenerApi.getState()
    const cloudUser = state.cloud?.user

    if (!cloudUser || !state.cloud?.enabled) {
      return
    }

    try {
      const { db } = await getFirebase()
      const settingsRef = doc(
        db,
        `users/${cloudUser.uid}/settings/structuredTodos`,
      )

      const settings: StructuredTodosSettings = {
        enabled: state.structuredTodos.enabled,
      }

      // Only include API key if it's set (write-only)
      if (state.structuredTodos.apiKey) {
        settings.apiKey = state.structuredTodos.apiKey
      }

      await setDoc(settingsRef, settings, { merge: true })
    } catch (error) {
      console.error('Failed to sync structured todos settings:', error)
    }
  },
})

// Listen for structured todos updates from Firestore
let todosUnsubscribe: (() => void) | null = null
let settingsUnsubscribe: (() => void) | null = null

structuredTodosListenerMiddleware.startListening({
  predicate: (_action, currentState: any, previousState: any) => {
    const wasConnected = previousState?.cloud?.status === 'connected'
    const isConnected = currentState.cloud?.status === 'connected'
    const wasEnabled = previousState?.cloud?.enabled
    const isEnabled = currentState.cloud?.enabled

    return (
      (!wasConnected && isConnected && isEnabled) ||
      (!wasEnabled && isEnabled && isConnected)
    )
  },
  effect: async (_action, listenerApi) => {
    const state: any = listenerApi.getState()
    const cloudUser = state.cloud?.user

    if (!cloudUser) {
      return
    }

    try {
      const { db } = await getFirebase()

      // Listen to settings changes (excluding API key which is write-only)
      const settingsRef = doc(
        db,
        `users/${cloudUser.uid}/settings/structuredTodos`,
      )

      // First, get initial settings
      const settingsSnap = await getDoc(settingsRef)
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data() as StructuredTodosSettings
        // Only sync enabled state, not API key
        listenerApi.dispatch(setStructuredTodosEnabled(settings.enabled))
      }

      // Then set up listener for future changes
      settingsUnsubscribe = onSnapshot(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const settings = snapshot.data() as StructuredTodosSettings
          // Only sync enabled state, not API key
          listenerApi.dispatch(setStructuredTodosEnabled(settings.enabled))
        }
      })

      // Listen to todo document for structured todos updates
      const todoDocRef = doc(db, `users/${cloudUser.uid}/doc/todo`)

      todosUnsubscribe = onSnapshot(todoDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          if (data?.structuredTodos && Array.isArray(data.structuredTodos)) {
            listenerApi.dispatch(
              setStructuredTodos(data.structuredTodos as StructuredTodo[]),
            )
          }
        }
      })
    } catch (error) {
      console.error('Failed to set up structured todos listeners:', error)
    }
  },
})

// Clean up listeners when disconnected
structuredTodosListenerMiddleware.startListening({
  predicate: (_action, currentState: any, previousState: any) => {
    const wasConnected = previousState?.cloud?.status === 'connected'
    const isConnected = currentState.cloud?.status !== 'connected'

    return wasConnected && isConnected
  },
  effect: async () => {
    if (todosUnsubscribe) {
      todosUnsubscribe()
      todosUnsubscribe = null
    }
    if (settingsUnsubscribe) {
      settingsUnsubscribe()
      settingsUnsubscribe = null
    }
  },
})
