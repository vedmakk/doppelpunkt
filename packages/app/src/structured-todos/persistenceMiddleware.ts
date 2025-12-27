import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setStructuredTodos,
  clearStructuredTodos,
  setProcessing,
  setStructuredTodosError,
} from './structuredTodosSlice'
import { StructuredTodosSettings, StructuredTodosState } from './types'
import { StructuredTodosManager } from './StructuredTodosManager'
import { safeLocalStorage } from '../shared/storage'
import { setCloudEnabled } from '../cloudsync/cloudSlice'
import { processTodos, generateContentHash } from './structuredTodosService'

const STRUCTURED_TODOS_KEY = 'structuredTodos'
const STRUCTURED_TODOS_ENABLED_KEY = `${STRUCTURED_TODOS_KEY}.enabled`
const STRUCTURED_TODOS_ITEMS_KEY = `${STRUCTURED_TODOS_KEY}.items`
const STRUCTURED_TODOS_HASH_KEY = `${STRUCTURED_TODOS_KEY}.hash`

// Debounce timer for processing todos
const PROCESS_DEBOUNCE_MS = 3000
let processTimer: ReturnType<typeof setTimeout> | null = null

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
    const storedHash = safeLocalStorage.getItem(STRUCTURED_TODOS_HASH_KEY)
    const todos = storedTodos ? JSON.parse(storedTodos) : []

    const structuredTodos: StructuredTodosState = {
      todos,
      enabled,
      apiKey: null, // Never loaded from storage (write-only)
      apiKeyIsSet: false,
      isProcessing: false,
      lastProcessedContentHash: storedHash ?? undefined,
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

      // Persist content hash
      if (state.structuredTodos.lastProcessedContentHash) {
        safeLocalStorage.setItem(
          STRUCTURED_TODOS_HASH_KEY,
          state.structuredTodos.lastProcessedContentHash,
        )
      } else {
        safeLocalStorage.removeItem(STRUCTURED_TODOS_HASH_KEY)
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

// Listen for cloud connection and start settings listener
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

// Listen for todo text changes and call the cloud function
structuredTodosListenerMiddleware.startListening({
  predicate: (action, currentState: any, previousState: any) => {
    // Ignore if this is a cloud-sourced update
    if ((action as any)?.meta?.fromCloud) {
      return false
    }

    // Only trigger when structured todos is enabled and cloud is connected
    if (!currentState.structuredTodos?.enabled) {
      return false
    }
    if (currentState.cloud?.status !== 'connected') {
      return false
    }
    if (!currentState.cloud?.user) {
      return false
    }

    // Only trigger when todo text changes
    const currentTodoText = currentState.editor?.documents?.todo?.text
    const previousTodoText = previousState?.editor?.documents?.todo?.text

    return currentTodoText !== previousTodoText
  },
  effect: async (_action, listenerApi) => {
    const state: any = listenerApi.getState()
    const todoText = state.editor?.documents?.todo?.text ?? ''
    const lastHash = state.structuredTodos?.lastProcessedContentHash

    // Clear any existing debounce timer
    if (processTimer) {
      clearTimeout(processTimer)
    }

    // Check if we even need to process (same content hash)
    try {
      const currentHash = await generateContentHash(todoText)
      if (currentHash === lastHash) {
        // Content hasn't changed, skip processing
        return
      }
    } catch {
      // Continue with processing if hash check fails
    }

    // Debounce the processing call
    processTimer = setTimeout(async () => {
      processTimer = null

      // Re-check state since this is debounced
      const currentState: any = listenerApi.getState()
      if (!currentState.structuredTodos?.enabled) {
        return
      }
      if (currentState.cloud?.status !== 'connected') {
        return
      }

      const currentTodoText = currentState.editor?.documents?.todo?.text ?? ''

      try {
        listenerApi.dispatch(setProcessing(true))
        listenerApi.dispatch(setStructuredTodosError(undefined))

        const result = await processTodos(currentTodoText)

        listenerApi.dispatch(
          setStructuredTodos({
            todos: result.todos,
            contentHash: result.contentHash,
          }),
        )
      } catch (error) {
        console.error('Failed to process todos:', error)
        listenerApi.dispatch(
          setStructuredTodosError(
            error instanceof Error ? error.message : 'Failed to process todos',
          ),
        )
      } finally {
        listenerApi.dispatch(setProcessing(false))
      }
    }, PROCESS_DEBOUNCE_MS)
  },
})

// Export the manager for use in other modules
export { structuredTodosManager }
