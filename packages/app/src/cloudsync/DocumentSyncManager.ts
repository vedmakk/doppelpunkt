// Document synchronization management for cloud sync
// Handles real-time document sync with last-write-wins and debounced saves

import debug from 'debug'

import { type WritingMode } from '../mode/modeSlice'
import {
  setCloudError,
  setCloudDocSnapshotMeta,
  setTextFromCloud,
} from './cloudSlice'
import {
  saveDocument,
  deleteDocument,
  listenToDocument,
  loadDocument,
} from './documentPersistence'
import { getFirebase } from './firebase'
import { doc, deleteDoc } from 'firebase/firestore'

const log = debug('DocumentSyncManager')

export class DocumentSyncManager {
  private documentListeners: Partial<Record<WritingMode, () => void>> = {}
  private saveTimers: Partial<
    Record<WritingMode, ReturnType<typeof globalThis.setTimeout>>
  > = {}
  private readonly SAVE_DEBOUNCE_MS = 5000

  startListening(
    userId: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    this.stopListening()

    const modes: WritingMode[] = ['editor', 'todo']
    modes.forEach((mode) => {
      this.documentListeners[mode] = listenToDocument(
        userId,
        mode,
        (documentData, metadata) => {
          log(`Received document update for '${mode}'`, documentData, metadata)

          dispatch(
            setCloudDocSnapshotMeta({
              mode,
              hasPendingWrites: metadata.hasPendingWrites,
              fromCache: metadata.fromCache,
            }),
          )

          if (!documentData || typeof documentData.text !== 'string') {
            return
          }

          const state = getState()
          const localDocument = state.editor.documents[mode]

          // Apply remote text if it differs from local
          if (localDocument.text !== documentData.text) {
            dispatch(
              setTextFromCloud({
                mode,
                text: documentData.text,
                cursorPos: Math.min(
                  localDocument.cursorPos,
                  documentData.text.length,
                ),
              }),
            )
          }
        },
      )
    })
  }

  stopListening(): void {
    Object.values(this.documentListeners).forEach((unsubscribe) => {
      if (unsubscribe) unsubscribe()
    })
    this.documentListeners = {}
    this.clearAllSaveTimers()
  }

  private async executeSave(
    userId: string,
    mode: WritingMode,
    getState: () => any,
    dispatch: (action: any) => void,
  ): Promise<void> {
    try {
      const state = getState()
      const text = state.editor.documents[mode].text

      await saveDocument(userId, mode, text)
      dispatch(setCloudError(undefined))
    } catch {
      dispatch(setCloudError('Failed to write to cloud'))
    }
  }

  scheduleDocumentSave(
    userId: string,
    mode: WritingMode,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    if (this.saveTimers[mode]) {
      globalThis.clearTimeout(this.saveTimers[mode])
    }

    this.saveTimers[mode] = globalThis.setTimeout(() => {
      this.executeSave(userId, mode, getState, dispatch)
    }, this.SAVE_DEBOUNCE_MS)
  }

  flushPendingSave(
    userId: string,
    mode: WritingMode,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    const timer = this.saveTimers[mode]
    if (!timer) return

    // Clear the timer and execute immediately
    globalThis.clearTimeout(timer)
    delete this.saveTimers[mode]

    // Execute save immediately (fire-and-forget for lifecycle events)
    this.executeSave(userId, mode, getState, dispatch)
  }

  flushAllPendingSaves(
    userId: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    const modes: WritingMode[] = ['editor', 'todo']
    modes.forEach((mode) => {
      this.flushPendingSave(userId, mode, getState, dispatch)
    })
  }

  async initialSync(userId: string, getState: () => any): Promise<void> {
    const modes: WritingMode[] = ['editor', 'todo']

    await Promise.all(
      modes.map(async (mode) => {
        try {
          // Check if document exists in cloud
          const existingDoc = await loadDocument(userId, mode)

          // If document doesn't exist, save the local version
          if (!existingDoc) {
            log(
              `Initial sync: no existing document for '${mode}', saving local version`,
            )
            const state = getState()
            const localText = state.editor.documents[mode].text

            await saveDocument(userId, mode, localText)
          }
        } catch (error) {
          // Log error but don't throw - we don't want initial sync to break connection
          if (import.meta.env.DEV) {
            console.error(`Failed to perform initial sync for ${mode}:`, error)
          }
        }
      }),
    )
  }

  async deleteUserDocuments(userId: string): Promise<void> {
    const modes: WritingMode[] = ['editor', 'todo']

    await Promise.all([
      ...modes.map((mode) => deleteDocument(userId, mode)),
      this.deleteUserProfile(userId),
    ])
  }

  private async deleteUserProfile(userId: string): Promise<void> {
    const { db } = await getFirebase()

    const userDocRef = doc(db, 'users', userId)
    await deleteDoc(userDocRef)
  }

  private clearAllSaveTimers(): void {
    Object.values(this.saveTimers).forEach((timer) => {
      if (timer) globalThis.clearTimeout(timer)
    })
    this.saveTimers = {}
  }
}
