// Type definitions for structured todos feature

// Import and re-export shared types
import type { StructuredTodo as SharedStructuredTodo } from '@doppelpunkt/shared'
export type StructuredTodo = SharedStructuredTodo

// Default Ollama configuration values
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'ministral-3:3b'

// Processing mode: cloud uses OpenAI via Firebase, local uses Ollama
export type ProcessingMode = 'cloud' | 'local'

// Ollama connection status for UI feedback
export type OllamaConnectionStatus =
  | 'untested'
  | 'success'
  | 'failed'
  | 'testing'

// Configuration for local Ollama instance
export interface OllamaConfig {
  readonly url: string // e.g., "http://localhost:11434"
  readonly model: string // User must specify the model to use
}

export interface StructuredTodosState {
  readonly todos: StructuredTodo[]
  readonly enabled: boolean
  readonly processingMode: ProcessingMode
  readonly apiKey: string | null // Write-only, never synced back from cloud (cloud mode only)
  readonly apiKeyIsSet: boolean // Cloud mode only
  readonly ollamaConfig: OllamaConfig // Local mode only
  readonly ollamaConnectionStatus: OllamaConnectionStatus // Local mode only
  readonly isProcessing: boolean
  readonly lastProcessedAt?: number
  readonly lastProcessedContentHash?: string // Hash of content that was last processed
  readonly error?: string
}

export interface StructuredTodosSettings {
  enabled: boolean
  hasApiKey?: boolean // Indicates if an API key is set (key itself is stored encrypted)
  processingMode?: ProcessingMode // Synced to cloud for multi-device consistency
}
