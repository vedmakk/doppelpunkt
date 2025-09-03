import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { StructuredTodosProcessor } from './structuredTodosProcessor'
import type { DocumentData } from './types'

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
    it('should return empty array for empty afterDoc.text', async () => {
      const afterDoc: DocumentData = {
        text: '',
        updatedAt: new Date(),
        rev: 2,
      }

      const result = await processor.extractTodos(afterDoc)
      expect(result).toEqual([])
      expect(mockOpenAI.responses.parse).not.toHaveBeenCalled()
    })

    it('should extract todos from valid afterDoc', async () => {
      const afterDoc: DocumentData = {
        text: 'I need to buy groceries tomorrow and finish the project by Friday',
        updatedAt: new Date(),
        rev: 3,
      }

      const result = await processor.extractTodos(afterDoc)

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id', 'todo-0')
      expect(result[0]).toHaveProperty('description', 'Test todo item')
      expect(result[0]).toHaveProperty('due')
      expect(typeof result[0].due).toBe('number')
      expect(result[0]).toHaveProperty('priority', 'medium')
      expect(result[0]).toHaveProperty('completed', false)

      expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
      // Ensure input is messages array containing the afterDoc text
      const callArgs = mockOpenAI.responses.parse.mock.calls[0][0]!
      expect(Array.isArray(callArgs.input)).toBe(true)
      expect(callArgs.input[0].role).toBe('user')
      expect(callArgs.input[0].content).toBe(afterDoc.text)
    })

    it('should include prevDoc context when provided', async () => {
      const prevDoc: DocumentData = {
        text: 'Previous text with tasks: buy milk',
        updatedAt: new Date(Date.now() - 1000 * 60),
        rev: 2,
        structuredTodos: [
          {
            id: 'todo-0',
            description: 'buy milk',
            completed: false,
          },
        ],
      }
      const afterDoc: DocumentData = {
        text: 'Add bread to list and mark milk as done',
        updatedAt: new Date(),
        rev: 3,
      }

      await processor.extractTodos(afterDoc, prevDoc)
      expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
      const callArgs = mockOpenAI.responses.parse.mock.calls[0][0]!
      expect(Array.isArray(callArgs.input)).toBe(true)
      expect(callArgs.input).toHaveLength(3)
      expect(callArgs.input[0].role).toBe('user')
      expect(callArgs.input[0].content).toBe(prevDoc.text)
      expect(callArgs.input[1].role).toBe('assistant')
      expect(typeof callArgs.input[1].content).toBe('string')
      expect(callArgs.input[2].role).toBe('user')
      expect(callArgs.input[2].content).toBe(afterDoc.text)
    })

    it('should handle API errors gracefully', async () => {
      const originalConsoleError = console.error
      console.error = () => {}

      try {
        mockOpenAI.responses.parse.mockRejectedValueOnce(
          new Error('API Error: Invalid request'),
        )

        const afterDoc: DocumentData = {
          text: 'Test todo text that is long enough to process',
          updatedAt: new Date(),
          rev: 1,
        }

        await expect(processor.extractTodos(afterDoc)).rejects.toThrow()
        expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
      } finally {
        console.error = originalConsoleError
      }
    })

    it('should handle invalid response gracefully', async () => {
      mockOpenAI.responses.parse.mockResolvedValueOnce({
        output_parsed: { todos: [] },
      })

      const afterDoc: DocumentData = {
        text: 'Test todo text that is long enough to process',
        updatedAt: new Date(),
        rev: 1,
      }

      const result = await processor.extractTodos(afterDoc)
      expect(result).toEqual([])
      expect(mockOpenAI.responses.parse).toHaveBeenCalledTimes(1)
    })
  })
})
