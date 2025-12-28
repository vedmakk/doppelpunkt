import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test'
import { testOllamaConnection, processWithOllama } from './ollamaService'

describe('ollamaService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mock.restore()
  })

  describe('testOllamaConnection', () => {
    it('should return success when Ollama is running', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2' }, { name: 'mistral' }],
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection('http://localhost:11434')

      expect(result.success).toBe(true)
      expect(result.availableModels).toEqual(['llama3.2', 'mistral'])
    })

    it('should return failure when server returns error status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection('http://localhost:11434')

      expect(result.success).toBe(false)
      expect(result.error).toContain('500')
    })

    it('should return failure with connection message when fetch fails', async () => {
      spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('fetch failed'),
      )

      const result = await testOllamaConnection('http://localhost:11434')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot connect to Ollama')
    })

    it('should return available models when connection succeeds', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2' },
            { name: 'codellama' },
            { name: 'mistral' },
          ],
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection('http://localhost:11434')

      expect(result.success).toBe(true)
      expect(result.availableModels).toContain('llama3.2')
      expect(result.availableModels).toContain('codellama')
      expect(result.availableModels).toContain('mistral')
    })

    it('should return success when specified model exists', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2' }, { name: 'mistral' }],
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection(
        'http://localhost:11434',
        'llama3.2',
      )

      expect(result.success).toBe(true)
      expect(result.availableModels).toEqual(['llama3.2', 'mistral'])
    })

    it('should return success when model matches with tag suffix', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2:latest' }, { name: 'mistral:7b' }],
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection(
        'http://localhost:11434',
        'llama3.2',
      )

      expect(result.success).toBe(true)
    })

    it('should return failure when specified model does not exist', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2' }, { name: 'mistral' }],
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection(
        'http://localhost:11434',
        'nonexistent-model',
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Model "nonexistent-model" not found')
      expect(result.error).toContain('ollama pull nonexistent-model')
      expect(result.availableModels).toEqual(['llama3.2', 'mistral'])
    })

    it('should skip model validation when model is empty', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2' }],
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await testOllamaConnection('http://localhost:11434', '')

      expect(result.success).toBe(true)
    })
  })

  describe('processWithOllama', () => {
    // Helper to create mock /api/chat response
    const createChatResponse = (todos: unknown[]) => ({
      ok: true,
      json: async () => ({
        message: {
          role: 'assistant',
          content: JSON.stringify({ todos }),
        },
        done: true,
      }),
    })

    it('should extract todos from text', async () => {
      const mockResponse = createChatResponse([
        { description: 'Buy groceries', priority: 'high' },
        { description: 'Call mom', due: '2025-01-15' },
      ])

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await processWithOllama(
        'http://localhost:11434',
        'llama3.2',
        'Buy groceries (urgent) and call mom on Jan 15',
      )

      expect(result.todos).toHaveLength(2)
      expect(result.todos[0].description).toBe('Buy groceries')
      expect(result.todos[0].priority).toBe('high')
      expect(result.todos[1].description).toBe('Call mom')
      expect(result.contentHash).toBeDefined()
    })

    it('should return empty todos for empty text', async () => {
      const result = await processWithOllama(
        'http://localhost:11434',
        'llama3.2',
        '',
      )

      expect(result.todos).toEqual([])
      expect(result.contentHash).toBeDefined()
    })

    it('should return empty todos for whitespace-only text', async () => {
      const result = await processWithOllama(
        'http://localhost:11434',
        'llama3.2',
        '   ',
      )

      expect(result.todos).toEqual([])
    })

    it('should throw error when model is not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: async () => 'model not found',
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      await expect(
        processWithOllama(
          'http://localhost:11434',
          'nonexistent-model',
          'Buy groceries',
        ),
      ).rejects.toThrow('Model "nonexistent-model" not found')
    })

    it('should throw error for malformed JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          message: {
            role: 'assistant',
            content: 'not valid json',
          },
          done: true,
        }),
      }

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      await expect(
        processWithOllama(
          'http://localhost:11434',
          'llama3.2',
          'Buy groceries',
        ),
      ).rejects.toThrow('Failed to parse')
    })

    it('should handle todos without optional fields', async () => {
      const mockResponse = createChatResponse([{ description: 'Simple task' }])

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await processWithOllama(
        'http://localhost:11434',
        'llama3.2',
        'Simple task',
      )

      expect(result.todos).toHaveLength(1)
      expect(result.todos[0].description).toBe('Simple task')
      expect(result.todos[0].due).toBeUndefined()
      expect(result.todos[0].priority).toBeUndefined()
      expect(result.todos[0].completed).toBeUndefined()
    })

    it('should validate priority values', async () => {
      const mockResponse = createChatResponse([
        { description: 'Task 1', priority: 'high' },
        { description: 'Task 2', priority: 'invalid' },
        { description: 'Task 3', priority: 'low' },
      ])

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result = await processWithOllama(
        'http://localhost:11434',
        'llama3.2',
        'Tasks',
      )

      expect(result.todos[0].priority).toBe('high')
      // Note: With structured outputs, invalid priorities shouldn't occur,
      // but the shared parser filters them out
      expect(result.todos[2].priority).toBe('low')
    })

    it('should include model in content hash', async () => {
      const mockResponse = createChatResponse([])

      spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      const result1 = await processWithOllama(
        'http://localhost:11434',
        'llama3.2',
        'Same text',
      )
      const result2 = await processWithOllama(
        'http://localhost:11434',
        'mistral',
        'Same text',
      )

      // Different models should produce different hashes for same text
      expect(result1.contentHash).not.toBe(result2.contentHash)
    })

    it('should use /api/chat endpoint with structured format', async () => {
      const mockResponse = createChatResponse([{ description: 'Test task' }])

      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as unknown as Response,
      )

      await processWithOllama('http://localhost:11434', 'llama3.2', 'Test task')

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const callArgs = fetchSpy.mock.calls[0]
      expect(callArgs[0]).toBe('http://localhost:11434/api/chat')

      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body.messages).toBeDefined()
      expect(body.format).toBeDefined()
      expect(body.stream).toBe(false)
    })
  })
})
