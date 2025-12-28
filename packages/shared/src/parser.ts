import { StructuredTodo, RawTodo } from './types.js'

/**
 * Parses and transforms raw LLM output (matching Zod schema) to StructuredTodo array.
 * Handles: ID generation, date string to timestamp conversion, priority validation, optional fields.
 *
 * @param rawTodos - Array of raw todos from LLM structured output
 * @returns Array of processed StructuredTodo objects
 */
export function parseExtractedTodos(rawTodos: RawTodo[]): StructuredTodo[] {
  return rawTodos
    .filter(
      (todo): todo is RawTodo =>
        todo !== null &&
        typeof todo === 'object' &&
        typeof todo.description === 'string' &&
        todo.description.trim().length > 0,
    )
    .map((todo, index): StructuredTodo => {
      const structuredTodo: StructuredTodo = {
        id: `todo-${index}`,
        description: todo.description,
      }

      // Convert due date string to timestamp
      if (todo.due !== null && todo.due !== undefined && todo.due !== '') {
        const timestamp = new Date(todo.due).getTime()
        if (!isNaN(timestamp)) {
          structuredTodo.due = timestamp
        }
      }

      // Include priority if valid
      if (todo.priority !== null && todo.priority !== undefined) {
        structuredTodo.priority = todo.priority
      }

      // Include completed status
      if (todo.completed !== null && todo.completed !== undefined) {
        structuredTodo.completed = todo.completed
      }

      return structuredTodo
    })
}
