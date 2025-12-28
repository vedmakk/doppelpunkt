import { z } from 'zod'

// Zod schema for a single todo item - used for structured LLM outputs
export const TodoSchema = z.object({
  description: z.string().describe('A clear, concise description of the task'),
  due: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Date and maybe time for when the task is due in format "YYYY-MM-DD HH:MM" or "YYYY-MM-DD". Do not set this if the task has no due date.',
    ),
  priority: z
    .enum(['low', 'medium', 'high'])
    .nullable()
    .optional()
    .describe('Priority level of the task'),
  completed: z
    .boolean()
    .nullable()
    .optional()
    .describe('Whether the task is completed'),
})

// Zod schema for the full response - array of todos
export const TodosResponseSchema = z.object({
  todos: z.array(TodoSchema).describe('List of extracted todo items'),
})

// Inferred type from Zod schema for raw LLM response
export type RawTodo = z.infer<typeof TodoSchema>
export type RawTodosResponse = z.infer<typeof TodosResponseSchema>

// Final structured todo type with processed fields
export interface StructuredTodo {
  id: string
  description: string
  due?: number // Timestamp in milliseconds (converted from date string)
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
}
