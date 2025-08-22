import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { StructuredTodosProcessor } from './structuredTodosProcessor'

// Mock the OpenAI module
const mockOpenAI = {
  chat: {
    completions: {
      create: mock(() =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  todos: [
                    {
                      id: 'test-todo-1',
                      description: 'Test todo item',
                      due: Date.now(),
                      priority: 'medium',
                      completed: false,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      ),
    },
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
    mockOpenAI.chat.completions.create.mockClear()
    processor = new StructuredTodosProcessor('test-api-key')
  })

  describe('extractTodos', () => {
    it('should return empty array for empty text', async () => {
      const result = await processor.extractTodos('')
      expect(result).toEqual([])
      // Should not call OpenAI API for empty text
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled()
    })

    it('should return empty array for very short text', async () => {
      const result = await processor.extractTodos('Hi')
      expect(result).toEqual([])
      // Should not call OpenAI API for very short text
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled()
    })

    it('should extract todos from valid text', async () => {
      const todoText =
        'I need to buy groceries tomorrow and finish the project by Friday'

      const result = await processor.extractTodos(todoText)

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('description', 'Test todo item')
      expect(result[0]).toHaveProperty('due')
      expect(result[0]).toHaveProperty('priority', 'medium')
      expect(result[0]).toHaveProperty('completed')

      // Should call OpenAI API for valid text
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors gracefully', async () => {
      // Suppress console.error during this test
      const originalConsoleError = console.error
      console.error = () => {}

      try {
        // Mock an API error
        mockOpenAI.chat.completions.create.mockRejectedValueOnce(
          new Error('API Error: Invalid request'),
        )

        const todoText = 'Test todo text that is long enough to process'

        await expect(processor.extractTodos(todoText)).rejects.toThrow()
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1)
      } finally {
        // Restore console.error
        console.error = originalConsoleError
      }
    })

    it('should handle invalid JSON response gracefully', async () => {
      // Mock invalid JSON response
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      })

      const todoText = 'Test todo text that is long enough to process'

      const result = await processor.extractTodos(todoText)
      expect(result).toEqual([])
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1)
    })
  })
})
