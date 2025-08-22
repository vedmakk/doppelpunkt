import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Timestamp } from 'firebase/firestore'

export interface StructuredTodoItem {
  description: string
  due: Timestamp | null
}

export interface StructuredState {
  enabled: boolean
  apiKey: string | null
  todos: StructuredTodoItem[]
  updatedAt?: number
}

const initialState: StructuredState = {
  enabled: false,
  apiKey: null,
  todos: [],
  updatedAt: undefined,
}

const structuredSlice = createSlice({
  name: 'structured',
  initialState,
  reducers: {
    setStructuredEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload
    },
    setStructuredApiKey(state, action: PayloadAction<string | null>) {
      state.apiKey = action.payload
    },
    setStructuredTodos(
      state,
      action: PayloadAction<{
        todos: StructuredTodoItem[]
        updatedAt?: number
      }>,
    ) {
      state.todos = action.payload.todos
      state.updatedAt = action.payload.updatedAt
    },
    clearStructuredTodos(state) {
      state.todos = []
      state.updatedAt = Date.now()
    },
    // Intent actions for middleware
    requestSaveStructuredConfig: (state) => state,
  },
})

export const structuredTodosReducer = structuredSlice.reducer
export const {
  setStructuredEnabled,
  setStructuredApiKey,
  setStructuredTodos,
  clearStructuredTodos,
  requestSaveStructuredConfig,
} = structuredSlice.actions
