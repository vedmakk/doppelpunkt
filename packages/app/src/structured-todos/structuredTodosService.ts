// Client-side service for calling the structured todos cloud function

import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from 'firebase/functions'
import { getFirebase } from '../cloudsync/firebase'
import { StructuredTodo } from './types'

export interface ProcessTodosResult {
  todos: StructuredTodo[]
  contentHash: string
}

let functionsEmulatorConnected = false

/**
 * Calls the processTodos cloud function to extract structured todos from text
 */
export async function processTodos(
  todoText: string,
): Promise<ProcessTodosResult> {
  const { app } = await getFirebase()
  const functions = getFunctions(app, 'europe-west1')

  // Connect to emulator in development if not already connected
  if (
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' &&
    !functionsEmulatorConnected
  ) {
    connectFunctionsEmulator(functions, 'localhost', 5005)
    functionsEmulatorConnected = true
  }

  const processTodosFn = httpsCallable<
    { todoText: string },
    ProcessTodosResult
  >(functions, 'processTodos')

  const result = await processTodosFn({ todoText })
  return result.data
}

/**
 * Generate content hash locally for comparison
 * Uses the same algorithm as the server
 */
export async function generateContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
