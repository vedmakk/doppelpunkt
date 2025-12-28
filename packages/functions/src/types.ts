// Type definitions for Firebase functions

export interface StructuredTodo {
  id: string
  description: string
  due?: number // Timestamp in milliseconds
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
}

export interface StructuredTodosSettings {
  enabled: boolean
  hasApiKey?: boolean
}
