// Document synchronization management for cloud sync
// Handles real-time document sync, conflict resolution, and debounced saves

import { type WritingMode } from '../mode/modeSlice'
import { setText } from '../editor/editorSlice'
import {
  setCloudError,
  setCloudDocBase,
  setCloudDocSnapshotMeta,
  setTextFromCloud,
  setCloudIsUploading,
} from './cloudSlice'
import {
  saveDocumentWithConflictResolution,
  deleteDocument,
  listenToDocument,
  loadDocument,
} from './documentPersistence'
import { getFirebase } from './firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { resolveTextConflict } from './conflictResolution'

export class DocumentSyncManager {
  private documentListeners: Partial<Record<WritingMode, () => void>> = {}
  private saveTimers: Partial<
    Record<WritingMode, ReturnType<typeof globalThis.setTimeout>>
  > = {}
  private readonly SAVE_DEBOUNCE_MS = 1000

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
          const cloudDoc = state.cloud.docs[mode]

          // Skip processing if this is the same revision we already have
          if (
            documentData.rev === cloudDoc.baseRev &&
            documentData.text === cloudDoc.baseText
          ) {
            return
          }

          // Check if we need conflict resolution
          const needsConflictResolution =
            cloudDoc.baseRev !== 0 && // We have a base (synced before)
            localDocument.text !== cloudDoc.baseText && // Local has changes
            documentData.text !== cloudDoc.baseText && // Remote has changes
            localDocument.text !== documentData.text // And they're different from each other

          if (needsConflictResolution) {
            // Perform bidirectional conflict resolution
            const resolution = resolveTextConflict(
              cloudDoc.baseText, // base (last known common version)
              localDocument.text, // local changes
              documentData.text, // remote changes
            )

            // Update cloud base to the new remote version
            dispatch(
              setCloudDocBase({
                mode,
                baseRev: documentData.rev,
                baseText: documentData.text,
              }),
            )

            // Apply resolved text if it differs from current local text
            if (resolution.mergedText !== localDocument.text) {
              dispatch(
                setTextFromCloud({
                  mode,
                  text: resolution.mergedText,
                  cursorPos: Math.min(
                    localDocument.cursorPos,
                    resolution.mergedText.length,
                  ),
                }),
              )
            }

            // If there was a conflict and we changed the text, schedule a save
            // to push the merged result back to the cloud
            if (
              resolution.wasConflicted &&
              resolution.mergedText !== documentData.text
            ) {
              this.scheduleDocumentSave(
                userId,
                mode,
                resolution.mergedText,
                getState,
                dispatch,
              )
            }
          } else {
            // No conflict - update base and apply remote changes if different
            dispatch(
              setCloudDocBase({
                mode,
                baseRev: documentData.rev,
                baseText: documentData.text,
              }),
            )

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

  scheduleDocumentSave(
    userId: string,
    mode: WritingMode,
    text: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    if (this.saveTimers[mode]) {
      globalThis.clearTimeout(this.saveTimers[mode])
    }

    this.saveTimers[mode] = globalThis.setTimeout(async () => {
      try {
        const cloudDoc = getState().cloud.docs[mode]
        await this.saveDocument(
          userId,
          mode,
          text,
          cloudDoc.baseRev,
          cloudDoc.baseText,
          dispatch,
          getState,
        )
        dispatch(setCloudError(undefined))
      } catch {
        dispatch(setCloudError('Failed to write to cloud'))
      }
    }, this.SAVE_DEBOUNCE_MS)
  }

  async initialSync(
    userId: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): Promise<void> {
    const modes: WritingMode[] = ['editor', 'todo']

    await Promise.all(
      modes.map(async (mode) => {
        try {
          // Check if document exists in cloud
          const existingDoc = await loadDocument(userId, mode)

          // If document doesn't exist, save the local version
          if (!existingDoc) {
            const state = getState()
            const localText = state.editor.documents[mode].text

            await this.saveDocument(
              userId,
              mode,
              localText,
              0, // No existing revision
              '', // No base text since document doesn't exist
              dispatch,
              getState,
            )
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

  private async saveDocument(
    userId: string,
    mode: WritingMode,
    localText: string,
    baseRev: number,
    baseText: string,
    dispatch: (action: any) => void,
    getState: () => any,
  ): Promise<void> {
    dispatch(setCloudIsUploading(true))
    const result = await saveDocumentWithConflictResolution(
      userId,
      mode,
      localText,
      baseRev,
      baseText,
    )
    dispatch(setCloudIsUploading(false))

    dispatch(
      setCloudDocBase({
        mode,
        baseRev: result.newRevision,
        baseText: result.finalText,
      }),
    )

    if (result.wasConflicted && result.finalText !== localText) {
      const localDoc = getState().editor.documents[mode]
      dispatch(
        setText({
          mode,
          text: result.finalText,
          cursorPos: Math.min(localDoc.cursorPos, result.finalText.length),
        }),
      )
    }
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
