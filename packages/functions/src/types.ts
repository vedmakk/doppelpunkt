// Type definitions for Firebase functions

// Re-export shared types
export { StructuredTodo } from '@doppelpunkt/shared'

// Function-specific types
export interface StructuredTodosSettings {
  enabled: boolean
  hasApiKey?: boolean
}
