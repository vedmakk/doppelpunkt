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
  readonly lastProcessedContentHash?: string // Hash of content that was last processed
  readonly error?: string
}

export interface StructuredTodosSettings {
  enabled: boolean
  hasApiKey?: boolean // Indicates if an API key is set (key itself is stored encrypted)
}
