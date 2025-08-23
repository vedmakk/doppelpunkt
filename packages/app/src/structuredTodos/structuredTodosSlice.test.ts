import { describe, it, expect, beforeEach, mock } from 'bun:test'
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

// Mock localStorage
const localStorageMock = {
  getItem: mock(() => null),
  setItem: mock(() => {}),
  removeItem: mock(() => {}),
  clear: mock(() => {}),
  length: 0,
  key: mock(() => null),
}

// Override global localStorage for tests
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('structuredTodosSlice', () => {
  let initialState: StructuredTodosState

  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
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
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'structuredTodos.enabled',
        'true',
      )
    })

    it('should disable structured todos', () => {
      const enabledState = { ...initialState, enabled: true }
      const state = structuredTodosReducer(
        enabledState,
        setStructuredTodosEnabled(false),
      )

      expect(state.enabled).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'structuredTodos.enabled',
      )
    })
  })

  describe('API key management', () => {
    it('should set API key', () => {
      const apiKey = 'test-api-key-123'
      const state = structuredTodosReducer(initialState, setApiKey(apiKey))

      expect(state.apiKey).toBe(apiKey)
      // API key should NOT be stored in localStorage
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
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
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'structuredTodos.items',
        JSON.stringify(mockTodos),
      )
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
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'structuredTodos.items',
      )
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
