import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StructuredTodo, StructuredTodosState } from './types'

// Initial state is a safe default. Actual persisted values are hydrated at store creation.
const initialState: StructuredTodosState = {
  todos: [],
  enabled: false,
  apiKey: null, // Never loaded from storage (write-only)
  apiKeyIsSet: false,
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

    setStructuredTodos(state, action: PayloadAction<StructuredTodo[]>) {
      state.todos = action.payload
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
} = structuredTodosSlice.actions
