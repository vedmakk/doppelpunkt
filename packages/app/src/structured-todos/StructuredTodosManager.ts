// StructuredTodos management for cloud sync
// Handles settings persistence, todos syncing, and cleanup

import debug from 'debug'

import { doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore'
import { getFirebase } from '../cloudsync/firebase'
import { StructuredTodosSettings, StructuredTodo } from './types'
import {
  setStructuredTodosEnabled,
  setApiKeyIsSet,
  setStructuredTodos,
} from './structuredTodosSlice'

const log = debug('StructuredTodosManager')

export interface StructuredTodosData {
  todos: StructuredTodo[]
  contentHash: string
  updatedAt?: number
}

export class StructuredTodosManager {
  private settingsUnsubscribe: (() => void) | null = null
  private todosUnsubscribe: (() => void) | null = null

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
   * Saves structured todos data (todos + hash) to Firestore
   */
  async saveTodosData(
    userId: string,
    data: StructuredTodosData,
  ): Promise<void> {
    const { db } = await getFirebase()
    const todosRef = doc(db, `users/${userId}/structuredTodos/data`)
    await setDoc(todosRef, {
      ...data,
      updatedAt: Date.now(),
    })
    log('Saved structured todos to Firestore', data.contentHash)
  }

  /**
   * Loads structured todos data from Firestore
   */
  async loadTodosData(userId: string): Promise<StructuredTodosData | null> {
    const { db } = await getFirebase()
    const todosRef = doc(db, `users/${userId}/structuredTodos/data`)
    const todosSnap = await getDoc(todosRef)

    if (todosSnap.exists()) {
      return todosSnap.data() as StructuredTodosData
    }
    return null
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
      dispatch(setApiKeyIsSet(!!settings.apiKey))
    }

    // Then set up listener for future settings changes
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

    // Listen to structured todos data changes (synced from other clients)
    const todosRef = doc(db, `users/${userId}/structuredTodos/data`)

    this.todosUnsubscribe = onSnapshot(todosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StructuredTodosData

        log('Received structured todos data update', data.contentHash)

        // Update local state with cloud data
        // Add metadata to indicate this came from cloud
        const action = setStructuredTodos({
          todos: data.todos,
          contentHash: data.contentHash,
        })
        ;(action as any).meta = { fromCloud: true }
        dispatch(action)
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
    if (this.todosUnsubscribe) {
      this.todosUnsubscribe()
      this.todosUnsubscribe = null
    }
  }

  /**
   * Deletes all structured todos data for a user
   */
  async deleteUserData(userId: string): Promise<void> {
    const { db } = await getFirebase()

    // Delete the structured todos settings document
    const settingsRef = doc(db, `users/${userId}/settings/structuredTodos`)
    const todosRef = doc(db, `users/${userId}/structuredTodos/data`)

    try {
      await Promise.all([deleteDoc(settingsRef), deleteDoc(todosRef)])
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
