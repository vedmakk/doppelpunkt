import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StructuredTodo, StructuredTodosState } from './types'

const STRUCTURED_TODOS_ENABLED_KEY = 'structuredTodos.enabled'
const STRUCTURED_TODOS_KEY = 'structuredTodos.items'

// Load initial state from localStorage
function loadInitialState(): StructuredTodosState {
  try {
    const enabled =
      localStorage.getItem(STRUCTURED_TODOS_ENABLED_KEY) === 'true'
    const storedTodos = localStorage.getItem(STRUCTURED_TODOS_KEY)
    const todos = storedTodos ? JSON.parse(storedTodos) : []

    return {
      todos,
      enabled,
      apiKey: null, // Never loaded from storage (write-only)
      isProcessing: false,
      error: undefined,
    }
  } catch {
    return {
      todos: [],
      enabled: false,
      apiKey: null,
      isProcessing: false,
      error: undefined,
    }
  }
}

const initialState: StructuredTodosState = loadInitialState()

const structuredTodosSlice = createSlice({
  name: 'structuredTodos',
  initialState,
  reducers: {
    setStructuredTodosEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload
      try {
        if (action.payload) {
          localStorage.setItem(STRUCTURED_TODOS_ENABLED_KEY, 'true')
        } else {
          localStorage.removeItem(STRUCTURED_TODOS_ENABLED_KEY)
        }
      } catch {
        // Ignore storage errors
      }
    },

    setApiKey(state, action: PayloadAction<string>) {
      state.apiKey = action.payload
      // API key is never stored locally for security reasons
    },

    clearApiKey(state) {
      state.apiKey = null
    },

    setStructuredTodos(state, action: PayloadAction<StructuredTodo[]>) {
      state.todos = action.payload
      state.lastProcessedAt = Date.now()

      // Cache todos in localStorage
      try {
        localStorage.setItem(
          STRUCTURED_TODOS_KEY,
          JSON.stringify(action.payload),
        )
      } catch {
        // Ignore storage errors
      }
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

      try {
        localStorage.removeItem(STRUCTURED_TODOS_KEY)
      } catch {
        // Ignore storage errors
      }
    },
  },
})

export const structuredTodosReducer = structuredTodosSlice.reducer
export const {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setStructuredTodos,
  setProcessing,
  setStructuredTodosError,
  clearStructuredTodos,
} = structuredTodosSlice.actions
