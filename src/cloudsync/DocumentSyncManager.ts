// Document synchronization management for cloud sync
// Handles real-time document sync, conflict resolution, and debounced saves

import { type WritingMode } from '../mode/modeSlice'
import { setText } from '../editor/editorSlice'
import {
  setCloudError,
  setCloudDocBase,
  setCloudDocSnapshotMeta,
} from './cloudSlice'
import {
  saveDocumentWithConflictResolution,
  deleteDocument,
  listenToDocument,
  getDocumentPath,
} from './documentPersistence'
import { getFirebase } from './firebase'

export class DocumentSyncManager {
  private documentListeners: Partial<Record<WritingMode, () => void>> = {}
  private saveTimers: Partial<Record<WritingMode, number>> = {}
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

          dispatch(
            setCloudDocBase({
              mode,
              baseRev: documentData.rev,
              baseText: documentData.text,
            }),
          )

          const localDocument = getState().editor.documents[mode]
          if (localDocument.text !== documentData.text) {
            dispatch(
              setText({
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

  async performInitialSync(
    userId: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): Promise<void> {
    const { db } = await getFirebase()
    const { doc, getDoc } = await import('firebase/firestore')

    const modes: WritingMode[] = ['editor', 'todo']

    await Promise.all(
      modes.map(async (mode) => {
        try {
          const ref = doc(db, getDocumentPath(userId, mode))
          const snap = await getDoc(ref)
          const remote = snap.data() as
            | { text?: string; rev?: number }
            | undefined
          const localText = getState().editor.documents[mode].text

          if (
            !remote ||
            typeof remote.text !== 'string' ||
            remote.text === ''
          ) {
            const base = getState().cloud.docs[mode]
            await this.saveDocument(
              userId,
              mode,
              localText,
              base.baseRev,
              base.baseText,
              dispatch,
              getState,
            )
          } else {
            const rev = typeof remote.rev === 'number' ? remote.rev : 0
            dispatch(
              setCloudDocBase({ mode, baseRev: rev, baseText: remote.text }),
            )
          }
        } catch {
          dispatch(setCloudError('Failed to perform initial sync'))
        }
      }),
    )
  }

  scheduleDocumentSave(
    userId: string,
    mode: WritingMode,
    text: string,
    getState: () => any,
    dispatch: (action: any) => void,
  ): void {
    if (this.saveTimers[mode]) {
      window.clearTimeout(this.saveTimers[mode])
    }

    this.saveTimers[mode] = window.setTimeout(async () => {
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
      } catch {
        dispatch(setCloudError('Failed to write to cloud'))
      }
    }, this.SAVE_DEBOUNCE_MS)
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
    const result = await saveDocumentWithConflictResolution(
      userId,
      mode,
      localText,
      baseRev,
      baseText,
    )

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
    const { doc, deleteDoc } = await import('firebase/firestore')

    const userDocRef = doc(db, 'users', userId)
    await deleteDoc(userDocRef)
  }

  private clearAllSaveTimers(): void {
    Object.values(this.saveTimers).forEach((timer) => {
      if (timer) window.clearTimeout(timer)
    })
    this.saveTimers = {}
  }
}
