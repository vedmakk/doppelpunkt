import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { StructuredTodosProcessor } from './structuredTodosProcessor'
import OpenAI from 'openai'

// Mock OpenAI
mock.module('openai', () => ({
  default: mock(() => ({})),
}))

describe('StructuredTodosProcessor', () => {
  let processor: StructuredTodosProcessor
  let mockOpenAI: any

  beforeEach(() => {
    // Create mock OpenAI instance
    mockOpenAI = {
      beta: {
        chat: {
          completions: {
            parse: mock(() => {}),
          },
        },
      },
    }

    // Mock the OpenAI constructor
    ;(OpenAI as any).mockImplementation(() => mockOpenAI)

    processor = new StructuredTodosProcessor('test-api-key')
  })

  describe('extractTodos', () => {
    it('should extract todos from text', async () => {
      const todoText = 'I need to wash clothes today. Buy groceries tomorrow.'

      const mockResponse = {
        choices: [
          {
            message: {
              parsed: {
                todos: [
                  {
                    id: 'todo-1',
                    description: 'Wash clothes',
                    due: Date.now(),
                    priority: 'medium',
                  },
                  {
                    id: 'todo-2',
                    description: 'Buy groceries',
                    due: Date.now() + 86400000,
                    priority: 'medium',
                  },
                ],
              },
            },
          },
        ],
      }

      mockOpenAI.beta.chat.completions.parse.mockResolvedValue(mockResponse)

      const result = await processor.extractTodos(todoText)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('due')
      expect(result[0]).toHaveProperty('priority')

      expect(mockOpenAI.beta.chat.completions.parse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: todoText }),
          ]),
          temperature: 0.3,
          max_tokens: 1000,
        }),
      )
    })

    it('should return empty array for empty text', async () => {
      const result = await processor.extractTodos('')
      expect(result).toEqual([])
      expect(mockOpenAI.beta.chat.completions.parse).not.toHaveBeenCalled()
    })

    it('should return empty array for very short text', async () => {
      const result = await processor.extractTodos('Hi')
      expect(result).toEqual([])
      expect(mockOpenAI.beta.chat.completions.parse).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      const todoText = 'Test todo text'
      const apiError = new OpenAI.APIError(
        400,
        { error: { message: 'Invalid request' } },
        'Bad Request',
        {} as any,
      )

      mockOpenAI.beta.chat.completions.parse.mockRejectedValue(apiError)

      await expect(processor.extractTodos(todoText)).rejects.toThrow(
        'OpenAI API Error',
      )
    })

    it('should handle missing parsed response', async () => {
      const todoText = 'Test todo text'

      const mockResponse = {
        choices: [
          {
            message: {
              parsed: null,
            },
          },
        ],
      }

      mockOpenAI.beta.chat.completions.parse.mockResolvedValue(mockResponse)

      const result = await processor.extractTodos(todoText)
      expect(result).toEqual([])
    })

    it('should generate IDs for todos without IDs', async () => {
      const todoText = 'Test todo'

      const mockResponse = {
        choices: [
          {
            message: {
              parsed: {
                todos: [
                  {
                    description: 'Test task',
                    priority: 'low',
                  },
                ],
              },
            },
          },
        ],
      }

      mockOpenAI.beta.chat.completions.parse.mockResolvedValue(mockResponse)

      const result = await processor.extractTodos(todoText)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBeDefined()
      expect(result[0].id).toMatch(/^todo-\d+-\d+$/)
    })
  })
})
