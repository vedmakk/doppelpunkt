// StructuredTodos management for cloud sync
// Handles settings persistence and cleanup for structured todos

import debug from 'debug'

import { doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore'
import { getFirebase } from '../cloudsync/firebase'
import { StructuredTodosSettings } from './types'
import {
  setStructuredTodosEnabled,
  setApiKeyIsSet,
} from './structuredTodosSlice'

const log = debug('StructuredTodosManager')

export class StructuredTodosManager {
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
   * Starts listening to structured todos settings changes
   * Note: Structured todos data now comes from the callable function response,
   * not from Firestore document updates
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
      dispatch(setApiKeyIsSet(!!settings.apiKey))
    }

    // Then set up listener for future changes
    this.settingsUnsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data() as StructuredTodosSettings

        log('Received structured todos settings update', settings)

        // Only sync enabled state, not API key
        dispatch(setStructuredTodosEnabled(settings.enabled))
        // Set flag to indicate if API key is set
        dispatch(setApiKeyIsSet(!!settings.apiKey))
      }
    })
  }

  /**
   * Stops listening to structured todos changes
   */
  stopListening(): void {
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
  }
}
