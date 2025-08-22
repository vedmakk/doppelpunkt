import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { StructuredTodo } from './types'

// Define the schema for structured output
const TodoSchema = z.object({
  id: z.string().describe('A unique identifier for the todo item'),
  description: z.string().describe('A clear, concise description of the task'),
  due: z
    .number()
    .optional()
    .describe('Unix timestamp in milliseconds for when the task is due'),
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .describe('Priority level of the task'),
  completed: z.boolean().optional().describe('Whether the task is completed'),
})

const TodosResponseSchema = z.object({
  todos: z.array(TodoSchema).describe('List of extracted todo items'),
})

export class StructuredTodosProcessor {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async extractTodos(todoText: string): Promise<StructuredTodo[]> {
    try {
      // Skip processing if text is empty or too short
      if (!todoText || todoText.trim().length < 10) {
        return []
      }

      const systemPrompt = `You are a helpful assistant that extracts todo items from text.
Extract actionable tasks from the provided text and structure them as todo items.

Guidelines:
- Focus on actionable tasks and items that need to be done
- Parse dates mentioned in the text and convert them to timestamps
- Infer priority based on context (urgent words = high, normal = medium, optional = low)
- Generate unique IDs for each todo item
- Keep descriptions clear and concise
- If a task mentions "today", use the current date
- If a task mentions a day of the week (e.g., "next Saturday"), calculate the appropriate date
- If a task mentions a specific date, use that date
- Tasks without dates should not have a due date
- Don't mark tasks as completed unless explicitly stated in the text

Current date for reference: ${new Date().toISOString()}`

      // Use standard completion API with structured JSON
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: todoText },
        ],
        response_format: zodResponseFormat(
          TodosResponseSchema,
          'todos_extraction',
        ),
        temperature: 0.3,
        max_tokens: 1000,
      })

      const message = completion.choices[0].message

      // Parse the JSON response
      let result: z.infer<typeof TodosResponseSchema> | null = null

      if ('parsed' in message) {
        result = (message as any).parsed
      } else if (message.content) {
        try {
          const parsed = JSON.parse(message.content)
          result = TodosResponseSchema.parse(parsed)
        } catch {
          return []
        }
      }

      if (!result || !result.todos) {
        return []
      }

      // Ensure all todos have valid IDs
      return result.todos.map((todo: StructuredTodo, index: number) => ({
        ...todo,
        id: todo.id || `todo-${Date.now()}-${index}`,
      }))
    } catch (error) {
      console.error('Error extracting todos:', error)

      // If it's an API error, we might want to handle it differently
      if (error instanceof OpenAI.APIError) {
        console.error('OpenAI API Error:', error.status, error.message)
        throw new Error(`OpenAI API Error: ${error.message}`)
      }

      throw error
    }
  }
}
