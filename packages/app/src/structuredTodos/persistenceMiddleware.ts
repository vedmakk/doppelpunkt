import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setStructuredTodos,
} from './structuredTodosSlice'
import { getFirebase } from '../cloudsync/firebase'
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { StructuredTodo, StructuredTodosSettings } from './types'

export const structuredTodosListenerMiddleware = createListenerMiddleware()

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
