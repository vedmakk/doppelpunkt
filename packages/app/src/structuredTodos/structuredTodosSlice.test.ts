import { describe, it, expect, beforeEach } from 'bun:test'
import {
  structuredTodosReducer,
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setStructuredTodos,
  setProcessing,
  setStructuredTodosError,
  clearStructuredTodos,
} from './structuredTodosSlice'
import { StructuredTodosState, StructuredTodo } from './types'

describe('structuredTodosSlice', () => {
  let initialState: StructuredTodosState

  beforeEach(() => {
    initialState = {
      todos: [],
      enabled: false,
      apiKey: null,
      isProcessing: false,
      error: undefined,
    }
  })

  describe('setStructuredTodosEnabled', () => {
    it('should enable structured todos', () => {
      const state = structuredTodosReducer(
        initialState,
        setStructuredTodosEnabled(true),
      )

      expect(state.enabled).toBe(true)
    })

    it('should disable structured todos', () => {
      const enabledState = { ...initialState, enabled: true }
      const state = structuredTodosReducer(
        enabledState,
        setStructuredTodosEnabled(false),
      )

      expect(state.enabled).toBe(false)
    })
  })

  describe('API key management', () => {
    it('should set API key', () => {
      const apiKey = 'test-api-key-123'
      const state = structuredTodosReducer(initialState, setApiKey(apiKey))

      expect(state.apiKey).toBe(apiKey)
      // API key should NOT be stored in localStorage (handled by middleware)
    })

    it('should clear API key', () => {
      const stateWithKey = { ...initialState, apiKey: 'test-key' }
      const state = structuredTodosReducer(stateWithKey, clearApiKey())

      expect(state.apiKey).toBeNull()
    })
  })

  describe('todos management', () => {
    const mockTodos: StructuredTodo[] = [
      {
        id: '1',
        description: 'Test todo 1',
        due: Date.now() + 1000,
        priority: 'high',
      },
      {
        id: '2',
        description: 'Test todo 2',
        due: Date.now() + 2000,
        priority: 'medium',
      },
    ]

    it('should set structured todos', () => {
      const state = structuredTodosReducer(
        initialState,
        setStructuredTodos(mockTodos),
      )

      expect(state.todos).toEqual(mockTodos)
      expect(state.lastProcessedAt).toBeDefined()
    })

    it('should clear all structured todos', () => {
      const stateWithTodos = {
        ...initialState,
        todos: mockTodos,
        lastProcessedAt: Date.now(),
      }
      const state = structuredTodosReducer(
        stateWithTodos,
        clearStructuredTodos(),
      )

      expect(state.todos).toEqual([])
      expect(state.lastProcessedAt).toBeUndefined()
    })
  })

  describe('processing state', () => {
    it('should set processing state', () => {
      const state = structuredTodosReducer(initialState, setProcessing(true))
      expect(state.isProcessing).toBe(true)

      const state2 = structuredTodosReducer(state, setProcessing(false))
      expect(state2.isProcessing).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to process todos'
      const state = structuredTodosReducer(
        initialState,
        setStructuredTodosError(errorMessage),
      )

      expect(state.error).toBe(errorMessage)
    })

    it('should clear error message', () => {
      const stateWithError = { ...initialState, error: 'Some error' }
      const state = structuredTodosReducer(
        stateWithError,
        setStructuredTodosError(undefined),
      )

      expect(state.error).toBeUndefined()
    })
  })
})
