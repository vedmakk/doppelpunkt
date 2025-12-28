// Service for communicating with local Ollama instance

import { zodToJsonSchema } from 'zod-to-json-schema'
import {
  StructuredTodo,
  TodosResponseSchema,
  RawTodosResponse,
  getSystemPrompt,
  parseExtractedTodos,
} from '@doppelpunkt/shared'
import { generateContentHash } from './structuredTodosService'

export interface OllamaTestResult {
  success: boolean
  error?: string
  availableModels?: string[]
}

export interface OllamaProcessResult {
  todos: StructuredTodo[]
  contentHash: string
}

interface OllamaTagsResponse {
  models?: Array<{
    name: string
    [key: string]: unknown
  }>
}

interface OllamaChatResponse {
  message: {
    role: string
    content: string
  }
  done: boolean
}

// Timeout for connection test (5 seconds)
const CONNECTION_TEST_TIMEOUT_MS = 5000

// Timeout for processing request (60 seconds - models may need to load)
const PROCESS_TIMEOUT_MS = 60000

// Convert Zod schema to JSON schema for Ollama structured outputs

const todosJsonSchema = zodToJsonSchema(TodosResponseSchema as any)

/**
 * Test connection to Ollama server and optionally verify the model exists
 * @param url - Ollama server URL
 * @param model - Optional model name to verify (if provided, checks if model is installed)
 * Returns available models on success
 */
export async function testOllamaConnection(
  url: string,
  model?: string,
): Promise<OllamaTestResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONNECTION_TEST_TIMEOUT_MS,
    )

    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `Server returned ${response.status}: ${response.statusText}`,
      }
    }

    const data = (await response.json()) as OllamaTagsResponse
    const availableModels =
      data.models?.map((m: { name: string }) => m.name) || []

    // If a model was specified, verify it exists
    if (model && model.trim()) {
      const modelExists = availableModels.some(
        (m) => m === model || m.startsWith(`${model}:`),
      )
      if (!modelExists) {
        return {
          success: false,
          error: `Model "${model}" not found. Run "ollama pull ${model}" to install it. Available models: ${availableModels.length > 0 ? availableModels.join(', ') : 'none'}`,
          availableModels,
        }
      }
    }

    return {
      success: true,
      availableModels,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timed out. Make sure Ollama is running.',
      }
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error:
          'Cannot connect to Ollama. Make sure Ollama is running. If Ollama is on a different machine, you may need to set OLLAMA_ORIGINS=* when starting Ollama.',
      }
    }

    // Check for CORS-related errors
    if (
      error instanceof TypeError &&
      (error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch'))
    ) {
      return {
        success: false,
        error:
          'Cannot connect to Ollama. Make sure Ollama is running. If Ollama is on a different machine, you may need to set OLLAMA_ORIGINS=* when starting Ollama.',
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown connection error',
    }
  }
}

/**
 * Process todo text using local Ollama instance with structured outputs
 */
export async function processWithOllama(
  url: string,
  model: string,
  todoText: string,
): Promise<OllamaProcessResult> {
  if (!todoText.trim()) {
    return {
      todos: [],
      contentHash: await generateContentHash(todoText),
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PROCESS_TIMEOUT_MS)

  try {
    // Use /api/chat endpoint with structured outputs (format parameter)
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: todoText },
        ],
        format: todosJsonSchema,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent extraction
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Model "${model}" not found. Run "ollama pull ${model}" to install it.`,
        )
      }
      const errorText = await response.text()
      throw new Error(`Ollama error: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as OllamaChatResponse

    // Parse the structured JSON response
    let parsed: RawTodosResponse
    try {
      parsed = JSON.parse(data.message.content) as RawTodosResponse
    } catch {
      throw new Error(
        'Failed to parse Ollama response as JSON. The model may not support structured outputs.',
      )
    }

    const rawTodos = parsed.todos
    if (!Array.isArray(rawTodos)) {
      return {
        todos: [],
        contentHash: await generateContentHash(`${todoText}::${model}`),
      }
    }

    // Use shared parser to transform raw response to StructuredTodo[]
    const todos = parseExtractedTodos(rawTodos)

    // Generate content hash including model name so switching models invalidates cache
    const contentHash = await generateContentHash(`${todoText}::${model}`)

    return {
      todos,
      contentHash,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        'Request timed out. The model may be loading or the text is too long.',
      )
    }

    throw error
  }
}
