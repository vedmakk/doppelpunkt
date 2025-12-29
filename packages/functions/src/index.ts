/**
 * Firebase Cloud Functions for doppelpunkt app
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { StructuredTodosProcessor } from './structuredTodosProcessor'
import { StructuredTodosSettings } from './types'
import { encryptApiKey, decryptApiKey, EncryptedData } from './encryption'

// Define the master encryption key secret
const ENCRYPTION_MASTER_KEY = defineSecret('ENCRYPTION_MASTER_KEY')

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

const cors = ['https://doppelpunkt-d2972.web.app/', 'https://doppelpunkt.io']

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
    secrets: [ENCRYPTION_MASTER_KEY],
    cors,
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
      // Get user's structured todos settings
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

      // Check if API key is set (fast check before decryption)
      if (!settings.hasApiKey) {
        throw new HttpsError(
          'failed-precondition',
          'OpenAI API key not configured',
        )
      }

      // Get and decrypt the API key
      const apiKey = await getDecryptedApiKey(userId)

      if (!apiKey) {
        throw new HttpsError(
          'failed-precondition',
          'API key not found or could not be decrypted',
        )
      }

      // Generate content hash for the input text
      const contentHash = await generateContentHash(todoText)

      // Process the todo text
      logger.info(`Processing todos for user ${userId}`)
      const processor = new StructuredTodosProcessor(apiKey)
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

// Request/Response types for API key management
export interface SetApiKeyRequest {
  apiKey: string
}

export interface SetApiKeyResponse {
  success: boolean
}

export interface ClearApiKeyResponse {
  success: boolean
}

/**
 * Callable function to securely store an API key
 * Encrypts the key using envelope encryption before storing in Firestore
 */
export const setApiKey = onCall<SetApiKeyRequest>(
  {
    region: 'europe-west1',
    secrets: [ENCRYPTION_MASTER_KEY],
    cors,
  },
  async (request): Promise<SetApiKeyResponse> => {
    const userId = request.auth?.uid

    if (!userId) {
      throw new HttpsError(
        'unauthenticated',
        'Must be signed in to set API key',
      )
    }

    const { apiKey } = request.data

    if (!apiKey || typeof apiKey !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'apiKey must be a non-empty string',
      )
    }

    // Basic validation - OpenAI keys start with 'sk-'
    if (!apiKey.startsWith('sk-')) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid API key format. OpenAI keys start with sk-',
      )
    }

    try {
      const masterKey = ENCRYPTION_MASTER_KEY.value()

      if (!masterKey) {
        logger.error('ENCRYPTION_MASTER_KEY not configured')
        throw new HttpsError('internal', 'Encryption not configured')
      }

      // Encrypt the API key
      const encryptedData = encryptApiKey(apiKey, masterKey, userId)

      // Store encrypted key in secrets path (not accessible to clients)
      const secretsRef = db.doc(`users/${userId}/secrets/apiKey`)
      await secretsRef.set({
        ...encryptedData,
        updatedAt: FieldValue.serverTimestamp(),
      })

      // Update settings to indicate key is set
      const settingsRef = db.doc(`users/${userId}/settings/structuredTodos`)
      await settingsRef.set({ hasApiKey: true }, { merge: true })

      logger.info(`API key stored for user ${userId}`)

      return { success: true }
    } catch (error) {
      logger.error(`Error setting API key for user ${userId}:`, error)

      if (error instanceof HttpsError) {
        throw error
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to store API key',
      )
    }
  },
)

/**
 * Callable function to clear the stored API key
 */
export const clearApiKey = onCall(
  {
    region: 'europe-west1',
    cors,
  },
  async (request): Promise<ClearApiKeyResponse> => {
    const userId = request.auth?.uid

    if (!userId) {
      throw new HttpsError(
        'unauthenticated',
        'Must be signed in to clear API key',
      )
    }

    try {
      // Delete the encrypted key
      const secretsRef = db.doc(`users/${userId}/secrets/apiKey`)
      await secretsRef.delete()

      // Update settings to indicate key is no longer set
      const settingsRef = db.doc(`users/${userId}/settings/structuredTodos`)
      await settingsRef.set({ hasApiKey: false }, { merge: true })

      logger.info(`API key cleared for user ${userId}`)

      return { success: true }
    } catch (error) {
      logger.error(`Error clearing API key for user ${userId}:`, error)

      if (error instanceof HttpsError) {
        throw error
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to clear API key',
      )
    }
  },
)

/**
 * Helper function to retrieve and decrypt an API key for server-side use
 */
async function getDecryptedApiKey(userId: string): Promise<string | null> {
  const masterKey = ENCRYPTION_MASTER_KEY.value()

  if (!masterKey) {
    logger.error('ENCRYPTION_MASTER_KEY not configured')
    return null
  }

  const secretsRef = db.doc(`users/${userId}/secrets/apiKey`)
  const secretsSnap = await secretsRef.get()

  if (!secretsSnap.exists) {
    return null
  }

  const encryptedData = secretsSnap.data() as EncryptedData

  try {
    return decryptApiKey(encryptedData, masterKey, userId)
  } catch (error) {
    logger.error(`Failed to decrypt API key for user ${userId}:`, error)
    return null
  }
}
