import { describe, it, expect, beforeEach } from 'bun:test'
import {
  structuredTodosReducer,
  setStructuredTodosEnabled,
  setApiKey,
  setApiKeyIsSet,
  clearApiKey,
  setStructuredTodos,
  setProcessing,
  setStructuredTodosError,
  clearStructuredTodos,
  clearAllStructuredTodosData,
  setProcessingMode,
  setOllamaUrl,
  setOllamaModel,
  setOllamaConnectionStatus,
} from './structuredTodosSlice'
import {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_URL,
  StructuredTodosState,
  StructuredTodo,
} from './types'

describe('structuredTodosSlice', () => {
  let initialState: StructuredTodosState

  beforeEach(() => {
    initialState = {
      todos: [],
      enabled: false,
      processingMode: 'cloud',
      apiKey: null,
      apiKeyIsSet: false,
      ollamaConfig: {
        url: DEFAULT_OLLAMA_URL,
        model: DEFAULT_OLLAMA_MODEL,
      },
      ollamaConnectionStatus: 'untested',
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

    it('should set apiKeyIsSet to true', () => {
      const state = structuredTodosReducer(initialState, setApiKeyIsSet(true))
      expect(state.apiKeyIsSet).toBe(true)
    })

    it('should set apiKeyIsSet to false', () => {
      const state = structuredTodosReducer(initialState, setApiKeyIsSet(false))
      expect(state.apiKeyIsSet).toBe(false)
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
        setStructuredTodos({ todos: mockTodos, contentHash: 'abc123' }),
      )

      expect(state.todos).toEqual(mockTodos)
      expect(state.lastProcessedAt).toBeDefined()
      expect(state.lastProcessedContentHash).toBe('abc123')
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

  describe('processing mode', () => {
    it('should set processing mode to local', () => {
      const state = structuredTodosReducer(
        initialState,
        setProcessingMode('local'),
      )
      expect(state.processingMode).toBe('local')
    })

    it('should set processing mode to cloud', () => {
      const localState = { ...initialState, processingMode: 'local' as const }
      const state = structuredTodosReducer(
        localState,
        setProcessingMode('cloud'),
      )
      expect(state.processingMode).toBe('cloud')
    })
  })

  describe('Ollama config', () => {
    it('should set Ollama URL', () => {
      const state = structuredTodosReducer(
        initialState,
        setOllamaUrl('http://custom:11434'),
      )
      expect(state.ollamaConfig.url).toBe('http://custom:11434')
    })

    it('should reset connection status when URL changes', () => {
      const stateWithConnection = {
        ...initialState,
        ollamaConnectionStatus: 'success' as const,
      }
      const state = structuredTodosReducer(
        stateWithConnection,
        setOllamaUrl('http://other:11434'),
      )
      expect(state.ollamaConnectionStatus).toBe('untested')
    })

    it('should set Ollama model', () => {
      const state = structuredTodosReducer(
        initialState,
        setOllamaModel('mistral'),
      )
      expect(state.ollamaConfig.model).toBe('mistral')
    })

    it('should set connection status to testing', () => {
      const state = structuredTodosReducer(
        initialState,
        setOllamaConnectionStatus('testing'),
      )
      expect(state.ollamaConnectionStatus).toBe('testing')
    })

    it('should set connection status to success', () => {
      const state = structuredTodosReducer(
        initialState,
        setOllamaConnectionStatus('success'),
      )
      expect(state.ollamaConnectionStatus).toBe('success')
    })

    it('should set connection status to failed', () => {
      const state = structuredTodosReducer(
        initialState,
        setOllamaConnectionStatus('failed'),
      )
      expect(state.ollamaConnectionStatus).toBe('failed')
    })
  })

  describe('clearAllStructuredTodosData', () => {
    it('should reset all structured todos state to initial values', () => {
      // Create a state with all fields populated
      const populatedState: StructuredTodosState = {
        todos: [
          {
            id: '1',
            description: 'Test todo',
            due: Date.now(),
            priority: 'high',
            completed: true,
          },
        ],
        enabled: true,
        processingMode: 'local',
        apiKey: 'test-api-key',
        apiKeyIsSet: true,
        ollamaConfig: {
          url: 'http://custom:11434',
          model: 'llama3.2',
        },
        ollamaConnectionStatus: 'success',
        isProcessing: true,
        error: 'Some error',
        lastProcessedAt: Date.now(),
      }

      const state = structuredTodosReducer(
        populatedState,
        clearAllStructuredTodosData(),
      )

      // Verify all fields are reset to initial state
      expect(state.todos).toEqual([])
      expect(state.enabled).toBe(false)
      expect(state.processingMode).toBe('cloud')
      expect(state.apiKey).toBeNull()
      expect(state.apiKeyIsSet).toBe(false)
      expect(state.ollamaConfig.url).toBe(DEFAULT_OLLAMA_URL)
      expect(state.ollamaConfig.model).toBe(DEFAULT_OLLAMA_MODEL)
      expect(state.ollamaConnectionStatus).toBe('untested')
      expect(state.isProcessing).toBe(false)
      expect(state.error).toBeUndefined()
      expect(state.lastProcessedAt).toBeUndefined()
    })
  })
})
