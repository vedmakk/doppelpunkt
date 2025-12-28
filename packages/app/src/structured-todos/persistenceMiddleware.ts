import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setStructuredTodos,
  clearStructuredTodos,
  setProcessing,
  setStructuredTodosError,
  setProcessingMode,
  setOllamaUrl,
  setOllamaModel,
} from './structuredTodosSlice'
import {
  ProcessingMode,
  StructuredTodosSettings,
  StructuredTodosState,
} from './types'
import { StructuredTodosManager } from './StructuredTodosManager'
import { safeLocalStorage } from '../shared/storage'
import { setCloudEnabled } from '../cloudsync/cloudSlice'
import {
  processTodos,
  generateContentHash,
  setApiKeyToCloud,
  clearApiKeyFromCloud,
} from './structuredTodosService'
import { processWithOllama } from './ollamaService'

const STRUCTURED_TODOS_KEY = 'structuredTodos'
const STRUCTURED_TODOS_ENABLED_KEY = `${STRUCTURED_TODOS_KEY}.enabled`
const STRUCTURED_TODOS_ITEMS_KEY = `${STRUCTURED_TODOS_KEY}.items`
const STRUCTURED_TODOS_HASH_KEY = `${STRUCTURED_TODOS_KEY}.hash`
const STRUCTURED_TODOS_PROCESSING_MODE_KEY = `${STRUCTURED_TODOS_KEY}.processingMode`
const STRUCTURED_TODOS_OLLAMA_URL_KEY = `${STRUCTURED_TODOS_KEY}.ollamaUrl`
const STRUCTURED_TODOS_OLLAMA_MODEL_KEY = `${STRUCTURED_TODOS_KEY}.ollamaModel`

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

    // Load processing mode and Ollama config
    const storedProcessingMode = safeLocalStorage.getItem(
      STRUCTURED_TODOS_PROCESSING_MODE_KEY,
    ) as ProcessingMode | null
    const processingMode: ProcessingMode = storedProcessingMode || 'cloud'
    const ollamaUrl =
      safeLocalStorage.getItem(STRUCTURED_TODOS_OLLAMA_URL_KEY) ||
      'http://localhost:11434'
    const ollamaModel =
      safeLocalStorage.getItem(STRUCTURED_TODOS_OLLAMA_MODEL_KEY) || ''

    const structuredTodos: StructuredTodosState = {
      todos,
      enabled,
      processingMode,
      apiKey: null, // Never loaded from storage (write-only)
      apiKeyIsSet: false,
      ollamaConfig: {
        url: ollamaUrl,
        model: ollamaModel,
      },
      ollamaConnectionStatus: 'untested',
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
      processingMode: 'cloud',
      apiKey: null,
      apiKeyIsSet: false,
      ollamaConfig: {
        url: 'http://localhost:11434',
        model: '',
      },
      ollamaConnectionStatus: 'untested',
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

// Listen for processing mode and Ollama config changes and persist to localStorage
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setProcessingMode, setOllamaUrl, setOllamaModel),
  effect: async (_action, listenerApi) => {
    const state: any = listenerApi.getState()
    try {
      // Persist processing mode
      safeLocalStorage.setItem(
        STRUCTURED_TODOS_PROCESSING_MODE_KEY,
        state.structuredTodos.processingMode,
      )

      // Persist Ollama config
      safeLocalStorage.setItem(
        STRUCTURED_TODOS_OLLAMA_URL_KEY,
        state.structuredTodos.ollamaConfig.url,
      )
      safeLocalStorage.setItem(
        STRUCTURED_TODOS_OLLAMA_MODEL_KEY,
        state.structuredTodos.ollamaConfig.model,
      )
    } catch {
      // Ignore storage failures
    }
  },
})

// Listen for setStructuredTodos and sync to Firestore (only for non-cloud updates)
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setStructuredTodos),
  effect: async (action, listenerApi) => {
    // Skip if this update came from cloud
    if ((action as any)?.meta?.fromCloud) {
      return
    }

    const state: any = listenerApi.getState()
    const cloudUser = state.cloud?.user

    if (!cloudUser || !state.cloud?.enabled) {
      return
    }

    try {
      // Save todos to Firestore
      await structuredTodosManager.saveTodosData(cloudUser.uid, {
        todos: state.structuredTodos.todos,
        contentHash: state.structuredTodos.lastProcessedContentHash,
      })
    } catch (error) {
      console.error('Failed to sync structured todos to Firestore:', error)
    }
  },
})

// Listen for enabled setting changes and sync to Firestore
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setStructuredTodosEnabled),
  effect: async (_action, listenerApi) => {
    const state: any = listenerApi.getState()
    const cloudUser = state.cloud?.user

    if (!cloudUser || !state.cloud?.enabled) {
      return
    }

    try {
      const settings: StructuredTodosSettings = {
        enabled: state.structuredTodos.enabled,
      }

      await structuredTodosManager.saveSettings(cloudUser.uid, settings)
    } catch (error) {
      console.error('Failed to sync structured todos settings:', error)
    }
  },
})

// Listen for API key changes and route through cloud functions
// This ensures the key is encrypted server-side before storage
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setApiKey, clearApiKey),
  effect: async (action, listenerApi) => {
    const state: any = listenerApi.getState()
    const cloudUser = state.cloud?.user

    if (!cloudUser || !state.cloud?.enabled) {
      return
    }

    try {
      if (action.type === setApiKey.type) {
        const apiKey = state.structuredTodos.apiKey
        if (apiKey) {
          await setApiKeyToCloud(apiKey)
        }
      } else if (action.type === clearApiKey.type) {
        await clearApiKeyFromCloud()
      }
    } catch (error) {
      console.error('Failed to update API key:', error)
      listenerApi.dispatch(
        setStructuredTodosError(
          error instanceof Error ? error.message : 'Failed to update API key',
        ),
      )
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

// Cascade disable: when cloud is disabled, disable structured todos (only if in cloud mode)
structuredTodosListenerMiddleware.startListening({
  matcher: isAnyOf(setCloudEnabled),
  effect: async (action, api) => {
    const enabled = (action as unknown as { payload: boolean }).payload
    const state: any = api.getState()
    const processingMode = state.structuredTodos?.processingMode

    if (!enabled && processingMode === 'cloud') {
      // Disable structured todos and clear cached data when cloud is disabled (only for cloud mode)
      api.dispatch(setStructuredTodosEnabled(false))
      api.dispatch(clearStructuredTodos())
    }
  },
})

// Listen for todo text changes and process todos (supports both cloud and local modes)
structuredTodosListenerMiddleware.startListening({
  predicate: (action, currentState: any, previousState: any) => {
    // Ignore if this is a cloud-sourced update
    if ((action as any)?.meta?.fromCloud) {
      return false
    }

    // Must be enabled
    if (!currentState.structuredTodos?.enabled) {
      return false
    }

    const processingMode = currentState.structuredTodos?.processingMode

    // Mode-specific requirements
    if (processingMode === 'cloud') {
      // Cloud mode: require cloud connected
      if (currentState.cloud?.status !== 'connected') {
        return false
      }
      if (!currentState.cloud?.user) {
        return false
      }
    } else if (processingMode === 'local') {
      // Local mode: require Ollama model to be set
      if (!currentState.structuredTodos?.ollamaConfig?.model) {
        return false
      }
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
    const processingMode = state.structuredTodos?.processingMode
    const ollamaConfig = state.structuredTodos?.ollamaConfig

    // Clear any existing debounce timer
    if (processTimer) {
      clearTimeout(processTimer)
    }

    // For local mode, include model in hash so switching models invalidates cache
    const hashInput =
      processingMode === 'local'
        ? `${todoText}::${ollamaConfig?.model || ''}`
        : todoText

    // Check if we even need to process (same content hash)
    let currentHash: string
    try {
      currentHash = await generateContentHash(hashInput)
      if (currentHash === lastHash) {
        // Content hasn't changed, skip processing
        return
      }
    } catch {
      // Continue with processing if hash check fails
      currentHash = ''
    }

    // Debounce the processing call
    processTimer = setTimeout(async () => {
      processTimer = null

      // Re-check state since this is debounced
      const currentState: any = listenerApi.getState()
      if (!currentState.structuredTodos?.enabled) {
        return
      }

      const currentProcessingMode = currentState.structuredTodos?.processingMode
      const currentOllamaConfig = currentState.structuredTodos?.ollamaConfig
      const currentTodoText = currentState.editor?.documents?.todo?.text ?? ''

      // Mode-specific re-checks
      if (currentProcessingMode === 'cloud') {
        if (currentState.cloud?.status !== 'connected') {
          return
        }
        const cloudUser = currentState.cloud?.user
        if (!cloudUser) {
          return
        }

        // Re-compute hash after debounce
        let finalHash: string
        try {
          finalHash = await generateContentHash(currentTodoText)
        } catch {
          finalHash = ''
        }

        // Check if Firestore already has data with this hash
        // (another client may have already processed it)
        try {
          const cloudData = await structuredTodosManager.loadTodosData(
            cloudUser.uid,
          )
          if (cloudData && cloudData.contentHash === finalHash) {
            // Cloud already has the latest data, use it instead of calling the function
            listenerApi.dispatch(
              setStructuredTodos({
                todos: cloudData.todos,
                contentHash: cloudData.contentHash,
              }),
            )
            return
          }
        } catch {
          // Continue with processing if cloud check fails
        }

        // Process with cloud (OpenAI)
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
          console.error('Failed to process todos (cloud):', error)
          listenerApi.dispatch(
            setStructuredTodosError(
              error instanceof Error
                ? error.message
                : 'Failed to process todos',
            ),
          )
        } finally {
          listenerApi.dispatch(setProcessing(false))
        }
      } else if (currentProcessingMode === 'local') {
        // Local mode: check Ollama model is set
        if (!currentOllamaConfig?.model) {
          return
        }

        // Process with local Ollama
        try {
          listenerApi.dispatch(setProcessing(true))
          listenerApi.dispatch(setStructuredTodosError(undefined))

          const result = await processWithOllama(
            currentOllamaConfig.url,
            currentOllamaConfig.model,
            currentTodoText,
          )

          listenerApi.dispatch(
            setStructuredTodos({
              todos: result.todos,
              contentHash: result.contentHash,
            }),
          )
        } catch (error) {
          console.error('Failed to process todos (local):', error)
          listenerApi.dispatch(
            setStructuredTodosError(
              error instanceof Error
                ? error.message
                : 'Failed to process todos with Ollama',
            ),
          )
        } finally {
          listenerApi.dispatch(setProcessing(false))
        }
      }
    }, PROCESS_DEBOUNCE_MS)
  },
})

// Export the manager for use in other modules
export { structuredTodosManager }
