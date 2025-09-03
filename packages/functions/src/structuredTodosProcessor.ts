import OpenAI from 'openai'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'
import { DocumentData, StructuredTodo } from './types'

// Define the schema for structured output
const TodoSchema = z.object({
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

const TodosResponseSchema = z.object({
  todos: z.array(TodoSchema).describe('List of extracted todo items'),
})

export class StructuredTodosProcessor {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async extractTodos(
    afterDoc: DocumentData,
    prevDoc?: DocumentData,
  ): Promise<StructuredTodo[]> {
    try {
      // Skip processing if text is empty
      if (!afterDoc.text) {
        return []
      }

      const systemPrompt = `You are a helpful assistant that extracts todo items from text.
Extract actionable tasks from the provided free text and structure them as todo items.

Guidelines:
- Focus on actionable tasks and items that need to be done
- Keep task descriptions short, clear and concise
- Differentiate between tasks and descriptions/details about tasks in the text and only extract tasks
- Infer dates mentioned in the text and convert them to the format "YYYY-MM-DD HH:MM" or "YYYY-MM-DD" (if no time is mentioned, use 00:00)
- If a task mentions "today", use the current date
- If a task mentions a day of the week (e.g., "next Saturday"), calculate the appropriate date based on the current date
- If a task mentions a specific date, use that date
- Tasks without dates should not have a due date
- Priority: In most cases, if no priority is obvious, leave it empty. Only set a priority, if you can infer it based on a task's context (urgent words = high, normal = medium, optional = low).
- Include all tasks (even completed ones). Mark tasks as completed when explicitly stated in the text.
- Do NOT include sub-tasks, only include the main task.

Context:
Current date: ${new Date().toISOString()}

Considerations:
This task extraction will run every time the user updates the free text in their todo document.
The extracted structured todos will be displayed to the user next to the free text. The free text is
the user's main source of truth for their todos and the details of each todo. The extracted structured todos should only
give an overview of the user's todos in the sense of an outline.
We want to avoid that the structured todos are changing unnecessarily, therefore keep task names consistent with previously extracted structured todo's and only update the tasks that have changed meaningfully, have been removed or added.
`

      let input: OpenAI.Responses.ResponseInputItem[] = [
        {
          role: 'user',
          content: afterDoc.text,
        },
      ]

      if (prevDoc && prevDoc.text && prevDoc.structuredTodos) {
        input = [
          {
            role: 'user',
            content: prevDoc.text,
          },
          {
            role: 'assistant',
            content: JSON.stringify(prevDoc.structuredTodos),
          },
          {
            role: 'user',
            content: afterDoc.text,
          },
        ]
      }

      // Use standard completion API with structured JSON
      const response = await this.openai.responses.parse({
        model: 'gpt-5-mini-2025-08-07',
        instructions: systemPrompt,
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

      // Ensure all todos have valid IDs and filter out undefined values for Firestore
      return result.todos.map(
        (todo: z.infer<typeof TodoSchema>, index: number): StructuredTodo => {
          const structuredTodo: StructuredTodo = {
            id: `todo-${index}`,
            description: todo.description,
          }

          // Only include optional fields if they have actual values
          if (todo.due !== null && todo.due !== undefined) {
            structuredTodo.due = new Date(todo.due).getTime()
          }
          if (todo.priority !== null && todo.priority !== undefined) {
            structuredTodo.priority = todo.priority
          }
          if (todo.completed !== null && todo.completed !== undefined) {
            structuredTodo.completed = todo.completed
          }

          return structuredTodo
        },
      )
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
