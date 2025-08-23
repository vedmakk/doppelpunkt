// Type definitions for structured todos feature

export interface StructuredTodo {
  id: string
  description: string
  due?: number // Timestamp in milliseconds
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
}

export interface StructuredTodosState {
  readonly todos: StructuredTodo[]
  readonly enabled: boolean
  readonly apiKey: string | null // Write-only, never synced back from cloud
  readonly apiKeyIsSet: boolean
  readonly isProcessing: boolean
  readonly lastProcessedAt?: number
  readonly error?: string
}

export interface StructuredTodosSettings {
  enabled: boolean
  apiKey?: string // Optional when reading from firestore (write-only)
}
