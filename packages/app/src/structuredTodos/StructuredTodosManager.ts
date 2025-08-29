// StructuredTodos management for cloud sync
// Handles settings persistence and cleanup for structured todos

import { doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore'
import { getFirebase } from '../cloudsync/firebase'
import { StructuredTodo, StructuredTodosSettings } from './types'
import {
  setStructuredTodosEnabled,
  setStructuredTodos,
  setApiKeyIsSet,
} from './structuredTodosSlice'

export class StructuredTodosManager {
  private todosUnsubscribe: (() => void) | null = null
  private settingsUnsubscribe: (() => void) | null = null

  /**
   * Saves structured todos settings to Firestore
   */
  async saveSettings(
    userId: string,
    settings: StructuredTodosSettings,
  ): Promise<void> {
    const { db } = await getFirebase()
    const settingsRef = doc(db, `users/${userId}/settings/structuredTodos`)
    await setDoc(settingsRef, settings, { merge: true })
  }

  /**
   * Starts listening to structured todos settings and data changes
   */
  async startListening(
    userId: string,
    dispatch: (action: any) => void,
  ): Promise<void> {
    this.stopListening()

    const { db } = await getFirebase()

    // Listen to settings changes (excluding API key which is write-only)
    const settingsRef = doc(db, `users/${userId}/settings/structuredTodos`)

    // First, get initial settings
    const settingsSnap = await getDoc(settingsRef)
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data() as StructuredTodosSettings
      // Only sync enabled state, not API key
      dispatch(setStructuredTodosEnabled(settings.enabled))
    }

    // Then set up listener for future changes
    this.settingsUnsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data() as StructuredTodosSettings
        // Only sync enabled state, not API key
        dispatch(setStructuredTodosEnabled(settings.enabled))
        // Set a "dummy" API key to indicate that the API key is set!
        if (settings.apiKey) {
          dispatch(setApiKeyIsSet(true))
        } else {
          dispatch(setApiKeyIsSet(false))
        }
      }
    })

    // Listen to todo document for structured todos updates
    const todoDocRef = doc(db, `users/${userId}/doc/todo`)

    this.todosUnsubscribe = onSnapshot(todoDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data?.structuredTodos && Array.isArray(data.structuredTodos)) {
          dispatch(setStructuredTodos(data.structuredTodos as StructuredTodo[]))
        }
      }
    })
  }

  /**
   * Stops listening to structured todos changes
   */
  stopListening(): void {
    if (this.todosUnsubscribe) {
      this.todosUnsubscribe()
      this.todosUnsubscribe = null
    }
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe()
      this.settingsUnsubscribe = null
    }
  }

  /**
   * Deletes all structured todos data for a user
   */
  async deleteUserData(userId: string): Promise<void> {
    const { db } = await getFirebase()

    // Delete the structured todos settings document
    const settingsRef = doc(db, `users/${userId}/settings/structuredTodos`)

    try {
      await deleteDoc(settingsRef)
    } catch (error) {
      // Document might not exist, which is fine
      if (import.meta.env.DEV) {
        console.log(
          'Settings document does not exist or could not be deleted:',
          error,
        )
      }
    }

    // Note: The structured todos data stored in the todo document
    // will be cleaned up by DocumentSyncManager.deleteUserDocuments()
    // since it's part of the main document structure
  }
}
