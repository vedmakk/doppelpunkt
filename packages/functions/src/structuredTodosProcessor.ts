import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import {
  TodosResponseSchema,
  StructuredTodo,
  getSystemPrompt,
  parseExtractedTodos,
} from '@doppelpunkt/shared'

export class StructuredTodosProcessor {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async extractTodos(text: string): Promise<StructuredTodo[]> {
    try {
      // Skip processing if text is empty
      if (!text) {
        return []
      }

      const input: OpenAI.Responses.ResponseInputItem[] = [
        {
          role: 'user',
          content: text,
        },
      ]

      // Use standard completion API with structured JSON
      const response = await this.openai.responses.parse({
        model: 'gpt-5-mini-2025-08-07',
        instructions: getSystemPrompt(),
        input,
        reasoning: {
          effort: 'low',
        },
        text: {
          format: zodTextFormat(TodosResponseSchema, 'todos_extraction'),
          verbosity: 'low',
        },
      })

      const result = response.output_parsed

      if (!result || !result.todos) {
        return []
      }

      // Use shared parser to transform raw response to StructuredTodo[]
      return parseExtractedTodos(result.todos)
    } catch (error) {
      console.error('Error extracting todos:', error)

      // If it's an API error, we might want to handle it differently
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        'message' in error
      ) {
        console.error('OpenAI API Error:', error.status, error.message)
        throw new Error(`OpenAI API Error: ${error.message}`)
      }

      throw error
    }
  }
}
