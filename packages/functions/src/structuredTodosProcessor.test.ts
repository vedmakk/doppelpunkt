import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { StructuredTodosProcessor } from './structuredTodosProcessor'

// Mock the OpenAI module
const mockOpenAI = {
  responses: {
    parse: mock<(args: any) => Promise<any>>(() =>
      Promise.resolve({
        output_parsed: {
          todos: [
            {
              description: 'Test todo item',
              due: '2024-01-15',
              priority: 'medium',
              completed: false,
            },
          ],
        },
      }),
    ),
  },
}

mock.module('openai', () => ({
  default: function MockOpenAI() {
    return mockOpenAI
  },
}))

describe('StructuredTodosProcessor', () => {
  let processor: StructuredTodosProcessor

  beforeEach(() => {
    // Reset all mocks before each test
    mockOpenAI.responses.parse.mockClear()
    processor = new StructuredTodosProcessor('test-api-key')
  })

  describe('extractTodos', () => {
    it('should return empty array for empty text', async () => {
      const result = await processor.extractTodos('')
      expect(result).toEqual([])
      expect(mockOpenAI.responses.parse).not.toHaveBeenCalled()
    })

    it('should extract todos from valid text', async () => {
      const text =
        'I need to buy groceries tomorrow and finish the project by Friday'

      const result = await processor.extractTodos(text)

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id', 'todo-0')
      expect(result[0]).toHaveProperty('description', 'Test todo item')
      expect(result[0]).toHaveProperty('due')
      expect(typeof result[0].due).toBe('number')
      expect(result[0]).toHaveProperty('priority', 'medium')
      expect(result[0]).toHaveProperty('completed', false)

      expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
      // Ensure input is messages array containing the text
      const callArgs = mockOpenAI.responses.parse.mock.calls[0][0]!
      expect(Array.isArray(callArgs.input)).toBe(true)
      expect(callArgs.input[0].role).toBe('user')
      expect(callArgs.input[0].content).toBe(text)
    })

    it('should handle API errors gracefully', async () => {
      const originalConsoleError = console.error
      console.error = () => {}

      try {
        mockOpenAI.responses.parse.mockRejectedValueOnce(
          new Error('API Error: Invalid request'),
        )

        const text = 'Test todo text that is long enough to process'

        await expect(processor.extractTodos(text)).rejects.toThrow()
        expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
      } finally {
        console.error = originalConsoleError
      }
    })

    it('should handle invalid response gracefully', async () => {
      mockOpenAI.responses.parse.mockResolvedValueOnce({
        output_parsed: { todos: [] },
      })

      const text = 'Test todo text that is long enough to process'

      const result = await processor.extractTodos(text)
      expect(result).toEqual([])
      expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple todos in response', async () => {
      mockOpenAI.responses.parse.mockResolvedValueOnce({
        output_parsed: {
          todos: [
            {
              description: 'First todo',
              priority: 'high',
              completed: false,
            },
            {
              description: 'Second todo',
              due: '2024-02-01',
              completed: true,
            },
          ],
        },
      })

      const text = 'I have multiple tasks to do'

      const result = await processor.extractTodos(text)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('todo-0')
      expect(result[0].description).toBe('First todo')
      expect(result[1].id).toBe('todo-1')
      expect(result[1].description).toBe('Second todo')
    })

    it('should handle null values in optional fields', async () => {
      mockOpenAI.responses.parse.mockResolvedValueOnce({
        output_parsed: {
          todos: [
            {
              description: 'Simple todo',
              due: null,
              priority: null,
              completed: null,
            },
          ],
        },
      })

      const text = 'A simple todo without details'

      const result = await processor.extractTodos(text)
      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('Simple todo')
      expect(result[0].due).toBeUndefined()
      expect(result[0].priority).toBeUndefined()
      expect(result[0].completed).toBeUndefined()
    })
  })
})
