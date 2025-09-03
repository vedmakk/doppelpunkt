/**
 * Firebase Cloud Functions for doppelpunkt app
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { StructuredTodosProcessor } from './structuredTodosProcessor'
import { DocumentData, StructuredTodosSettings } from './types'

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

/**
 * Process todo documents when they are created or updated
 * Extracts structured todos using OpenAI API
 */
export const processTodoDocument = onDocumentWritten(
  {
    document: 'users/{userId}/doc/todo',
    region: 'europe-west1', // Adjust region as needed
    maxInstances: 10,
  },
  async (event) => {
    const userId = event.params.userId
    const afterData = event.data?.after?.data() as DocumentData | undefined
    const beforeData = event.data?.before?.data() as DocumentData | undefined

    // Skip if document was deleted
    if (!afterData) {
      logger.info(`Todo document deleted for user ${userId}`)
      return null
    }

    // Skip if text hasn't changed
    if (beforeData?.text === afterData.text) {
      logger.info(`Todo text unchanged for user ${userId}, skipping processing`)
      return null
    }

    try {
      // Get user's structured todos settings
      const settingsRef = db.doc(`users/${userId}/settings/structuredTodos`)
      const settingsSnap = await settingsRef.get()

      if (!settingsSnap.exists) {
        logger.info(`No structured todos settings for user ${userId}`)
        return null
      }

      const settings = settingsSnap.data() as StructuredTodosSettings

      // Check if structured todos are enabled and API key is provided
      if (!settings.enabled) {
        logger.info(`Structured todos disabled for user ${userId}`)
        return null
      }

      if (!settings.apiKey) {
        logger.warn(`No API key provided for user ${userId}`)
        return null
      }

      // Process the todo text
      logger.info(`Processing todo document for user ${userId}`)
      const processor = new StructuredTodosProcessor(settings.apiKey)
      const structuredTodos = await processor.extractTodos(
        afterData,
        beforeData,
      )

      // Update the document with structured todos
      const todoDocRef = db.doc(`users/${userId}/doc/todo`)
      await todoDocRef.update({
        structuredTodos,
        structuredTodosProcessedAt: new Date(),
      })

      logger.info(
        `Successfully processed ${structuredTodos.length} todos for user ${userId}`,
      )
      return { success: true, todosCount: structuredTodos.length }
    } catch (error) {
      logger.error(`Error processing todo document for user ${userId}:`, error)

      // Store error state in document for client visibility
      try {
        const todoDocRef = db.doc(`users/${userId}/doc/todo`)
        await todoDocRef.update({
          structuredTodosError:
            error instanceof Error ? error.message : 'Processing failed',
          structuredTodosProcessedAt: new Date(),
        })
      } catch (updateError) {
        logger.error('Failed to update error state:', updateError)
      }

      throw error
    }
  },
)
