// Document synchronization management for cloud sync
// Handles real-time document sync with last-write-wins

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
  }

  async saveDocumentNow(
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
}
