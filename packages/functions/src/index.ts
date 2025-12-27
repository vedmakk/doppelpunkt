/**
 * Firebase Cloud Functions for doppelpunkt app
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { StructuredTodosProcessor } from './structuredTodosProcessor'
import { StructuredTodosSettings } from './types'

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

export interface ProcessTodosRequest {
  todoText: string
}

export interface ProcessTodosResponse {
  todos: Array<{
    id: string
    description: string
    due?: number
    priority?: 'low' | 'medium' | 'high'
    completed?: boolean
  }>
  contentHash: string
}

/**
 * HTTP callable function to process todo text and extract structured todos
 * Called by the client when todo content changes
 */
export const processTodos = onCall<ProcessTodosRequest>(
  {
    region: 'europe-west1',
    maxInstances: 10,
  },
  async (request): Promise<ProcessTodosResponse> => {
    const userId = request.auth?.uid

    if (!userId) {
      throw new HttpsError(
        'unauthenticated',
        'Must be signed in to process todos',
      )
    }

    const { todoText } = request.data

    if (typeof todoText !== 'string') {
      throw new HttpsError('invalid-argument', 'todoText must be a string')
    }

    try {
      // Get user's structured todos settings (for API key)
      const settingsRef = db.doc(`users/${userId}/settings/structuredTodos`)
      const settingsSnap = await settingsRef.get()

      if (!settingsSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Structured todos settings not found',
        )
      }

      const settings = settingsSnap.data() as StructuredTodosSettings

      if (!settings.enabled) {
        throw new HttpsError(
          'failed-precondition',
          'Structured todos is not enabled',
        )
      }

      if (!settings.apiKey) {
        throw new HttpsError(
          'failed-precondition',
          'OpenAI API key not configured',
        )
      }

      // Generate content hash for the input text
      const contentHash = await generateContentHash(todoText)

      // Process the todo text
      logger.info(`Processing todos for user ${userId}`)
      const processor = new StructuredTodosProcessor(settings.apiKey)
      const todos = await processor.extractTodos(todoText)

      logger.info(
        `Successfully processed ${todos.length} todos for user ${userId}`,
      )

      return {
        todos,
        contentHash,
      }
    } catch (error) {
      logger.error(`Error processing todos for user ${userId}:`, error)

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to process todos',
      )
    }
  },
)

/**
 * Generate a simple hash of the content for cache comparison
 */
async function generateContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
