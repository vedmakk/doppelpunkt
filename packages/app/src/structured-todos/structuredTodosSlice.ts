import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_URL,
  OllamaConnectionStatus,
  ProcessingMode,
  StructuredTodo,
  StructuredTodosState,
} from './types'

// Initial state is a safe default. Actual persisted values are hydrated at store creation.
const initialState: StructuredTodosState = {
  todos: [],
  enabled: false,
  processingMode: 'cloud',
  apiKey: null, // Never loaded from storage (write-only)
  apiKeyIsSet: false,
  ollamaConfig: {
    url: DEFAULT_OLLAMA_URL,
    model: DEFAULT_OLLAMA_MODEL,
  },
  ollamaConnectionStatus: 'untested',
  isProcessing: false,
  error: undefined,
}

const structuredTodosSlice = createSlice({
  name: 'structuredTodos',
  initialState,
  reducers: {
    setStructuredTodosEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload
    },

    setApiKey(state, action: PayloadAction<string>) {
      state.apiKey = action.payload
      // API key is never stored locally for security reasons
    },

    clearApiKey(state) {
      state.apiKey = null
    },

    setApiKeyIsSet(state, action: PayloadAction<boolean>) {
      state.apiKeyIsSet = action.payload
    },

    setStructuredTodos(
      state,
      action: PayloadAction<{ todos: StructuredTodo[]; contentHash: string }>,
    ) {
      state.todos = action.payload.todos
      state.lastProcessedContentHash = action.payload.contentHash
      state.lastProcessedAt = Date.now()
    },

    setProcessing(state, action: PayloadAction<boolean>) {
      state.isProcessing = action.payload
    },

    setStructuredTodosError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload
    },

    clearStructuredTodos(state) {
      state.todos = []
      state.lastProcessedAt = undefined
      state.lastProcessedContentHash = undefined
    },

    // Processing mode actions
    setProcessingMode(state, action: PayloadAction<ProcessingMode>) {
      state.processingMode = action.payload
    },

    // Ollama configuration actions
    setOllamaUrl(state, action: PayloadAction<string>) {
      state.ollamaConfig = {
        ...state.ollamaConfig,
        url: action.payload,
      }
      // Reset connection status when URL changes
      state.ollamaConnectionStatus = 'untested'
    },

    setOllamaModel(state, action: PayloadAction<string>) {
      state.ollamaConfig = {
        ...state.ollamaConfig,
        model: action.payload,
      }
    },

    setOllamaConnectionStatus(
      state,
      action: PayloadAction<OllamaConnectionStatus>,
    ) {
      state.ollamaConnectionStatus = action.payload
    },

    clearAllStructuredTodosData(state) {
      state.todos = []
      state.enabled = false
      state.processingMode = 'cloud'
      state.apiKey = null
      state.apiKeyIsSet = false
      state.ollamaConfig = {
        url: DEFAULT_OLLAMA_URL,
        model: DEFAULT_OLLAMA_MODEL,
      }
      state.ollamaConnectionStatus = 'untested'
      state.isProcessing = false
      state.error = undefined
      state.lastProcessedAt = undefined
      state.lastProcessedContentHash = undefined
    },
  },
})

export const structuredTodosReducer = structuredTodosSlice.reducer
export const {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setApiKeyIsSet,
  setStructuredTodos,
  setProcessing,
  setStructuredTodosError,
  clearStructuredTodos,
  setProcessingMode,
  setOllamaUrl,
  setOllamaModel,
  setOllamaConnectionStatus,
  clearAllStructuredTodosData,
} = structuredTodosSlice.actions
