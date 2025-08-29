import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  clearStructuredTodos,
} from './structuredTodosSlice'
import { StructuredTodosSettings, StructuredTodosState } from './types'
import { StructuredTodosManager } from './StructuredTodosManager'
import { safeLocalStorage } from '../shared/storage'
import { setCloudEnabled } from '../cloudsync/cloudSlice'

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
      safeLocalStorage.getItem(STRUCTURED_TODOS_ENABLED_KEY) === 'true'
    const storedTodos = safeLocalStorage.getItem(STRUCTURED_TODOS_ITEMS_KEY)
    const todos = storedTodos ? JSON.parse(storedTodos) : []

    const structuredTodos: StructuredTodosState = {
      todos,
      enabled,
      apiKey: null, // Never loaded from storage (write-only)
      apiKeyIsSet: false,
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
      apiKeyIsSet: false,
      isProcessing: false,
      error: undefined,
    }
    return { structuredTodos }
  }
}

// Create singleton instance
const structuredTodosManager = new StructuredTodosManager()

export const structuredTodosListenerMiddleware = createListenerMiddleware()

// Listen for local state changes and persist to localStorage
structuredTodosListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    // Only trigger when relevant structured todos state actually changes
    const current = (currentState as any).structuredTodos
    const previous = (previousState as any)?.structuredTodos

    if (!previous) return true // Initial state

    return (
      current.enabled !== previous.enabled ||
      JSON.stringify(current.todos) !== JSON.stringify(previous.todos)
    )
  },
  effect: async (_action, listenerApi) => {
    const state: any = listenerApi.getState()
    try {
      // Persist enabled state
      if (state.structuredTodos.enabled) {
        safeLocalStorage.setItem(STRUCTURED_TODOS_ENABLED_KEY, 'true')
      } else {
        safeLocalStorage.removeItem(STRUCTURED_TODOS_ENABLED_KEY)
      }

      // Persist todos
      if (state.structuredTodos.todos.length > 0) {
        safeLocalStorage.setItem(
          STRUCTURED_TODOS_ITEMS_KEY,
          JSON.stringify(state.structuredTodos.todos),
        )
      } else {
        safeLocalStorage.removeItem(STRUCTURED_TODOS_ITEMS_KEY)
      }
    } catch {
      // Ignore storage failures
    }
  },
})

// Listen for settings changes and sync to Firestore
structuredTodosListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    // Only trigger for specific action types that affect settings
    const actionType = action.type as string
    const allowedTypes = [
      setStructuredTodosEnabled.type,
      setApiKey.type,
      clearApiKey.type,
    ] as string[]

    if (!allowedTypes.includes(actionType)) {
      return false
    }

    // Ensure we have the updated state by checking if relevant values changed
    const current = (currentState as any).structuredTodos
    const previous = (previousState as any)?.structuredTodos

    if (!previous) return true // Initial state

    return (
      current.enabled !== previous.enabled || current.apiKey !== previous.apiKey
    )
  },
  effect: async (action, listenerApi) => {
    const state: any = listenerApi.getState()
    const cloudUser = state.cloud?.user

    if (!cloudUser || !state.cloud?.enabled) {
      return
    }

    try {
      const settings: StructuredTodosSettings = {
        enabled: state.structuredTodos.enabled,
      }

      // Only include API key if it's set (write-only)
      if (state.structuredTodos.apiKey) {
        settings.apiKey = state.structuredTodos.apiKey
      } else if (action.type === clearApiKey.type) {
        settings.apiKey = ''
      }

      await structuredTodosManager.saveSettings(cloudUser.uid, settings)
    } catch (error) {
      console.error('Failed to sync structured todos settings:', error)
    }
  },
})

// Listen for structured todos updates from Firestore
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
      await structuredTodosManager.startListening(
        cloudUser.uid,
        listenerApi.dispatch,
      )
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
    structuredTodosManager.stopListening()
  },
})

// Cascade disable: when cloud is disabled, disable structured todos
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudEnabled),
  effect: async (action, api) => {
    const enabled = (action as unknown as { payload: boolean }).payload
    if (!enabled) {
      // Disable structured todos and clear cached data when cloud is disabled
      api.dispatch(setStructuredTodosEnabled(false))
      api.dispatch(clearStructuredTodos())
    }
  },
})

// Export the manager for use in other modules
export { structuredTodosManager }
