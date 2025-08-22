// Document persistence layer for Firestore operations
// Handles saving, loading, and syncing documents with conflict resolution

import { type Timestamp } from 'firebase/firestore'
import { getFirebase } from './firebase'
import { resolveTextConflict } from './conflictResolution'
import { type WritingMode } from '../mode/modeSlice'

export interface DocumentData {
  text: string
  updatedAt: Timestamp
  rev: number
}

export interface SaveResult {
  newRevision: number
  finalText: string
  wasConflicted: boolean
}

/**
 * Creates the Firestore document path for a user's document
 */
export function getDocumentPath(userId: string, mode: WritingMode): string {
  return `users/${userId}/doc/${mode}`
}

/**
 * Saves a document to Firestore with optimistic concurrency control
 * Handles conflicts using three-way merge when they occur
 */
export async function saveDocumentWithConflictResolution(
  userId: string,
  mode: WritingMode,
  localText: string,
  expectedRevision: number,
  baseText: string,
): Promise<SaveResult> {
  const { db } = await getFirebase()
  const { doc, serverTimestamp, runTransaction, getDoc } = await import(
    'firebase/firestore'
  )

  const docRef = doc(db, getDocumentPath(userId, mode))

  // First attempt: try to save with expected revision
  try {
    const newRevision = await saveWithTransaction(
      docRef,
      localText,
      expectedRevision,
      serverTimestamp,
      runTransaction,
      db,
    )

    return {
      newRevision,
      finalText: localText,
      wasConflicted: false,
    }
  } catch (error: any) {
    if (error?.message !== 'revision-conflict') {
      throw error
    }
  }

  // Conflict detected - perform three-way merge
  const remoteDoc = await getDoc(docRef)
  const remoteData = remoteDoc.data() as Partial<DocumentData> | undefined

  const remoteText = remoteData?.text ?? ''
  const remoteRevision = remoteData?.rev ?? 0

  const resolution = resolveTextConflict(baseText, localText, remoteText)

  // Save the resolved text with the current remote revision
  const newRevision = await saveWithTransaction(
    docRef,
    resolution.mergedText,
    remoteRevision,
    serverTimestamp,
    runTransaction,
    db,
  )

  return {
    newRevision,
    finalText: resolution.mergedText,
    wasConflicted: true,
  }
}

/**
 * Loads a document from Firestore
 */
export async function loadDocument(
  userId: string,
  mode: WritingMode,
): Promise<DocumentData | null> {
  const { db } = await getFirebase()
  const { doc, getDoc } = await import('firebase/firestore')

  const docRef = doc(db, getDocumentPath(userId, mode))
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data() as Partial<DocumentData>

  return {
    text: data.text ?? '',
    updatedAt: data.updatedAt as Timestamp,
    rev: data.rev ?? 0,
  }
}

/**
 * Deletes a document from Firestore
 */
export async function deleteDocument(
  userId: string,
  mode: WritingMode,
): Promise<void> {
  const { db } = await getFirebase()
  const { doc, deleteDoc } = await import('firebase/firestore')

  const docRef = doc(db, getDocumentPath(userId, mode))
  await deleteDoc(docRef)
}

/**
 * Sets up a real-time listener for document changes
 */
export function listenToDocument(
  userId: string,
  mode: WritingMode,
  onUpdate: (
    data: DocumentData | null,
    metadata: { hasPendingWrites: boolean; fromCache: boolean },
  ) => void,
): () => void {
  let unsubscribe: (() => void) | null = null

  // Async setup to handle Firebase imports
  const setupListener = async () => {
    const { db } = await getFirebase()
    const { doc, onSnapshot } = await import('firebase/firestore')

    const docRef = doc(db, getDocumentPath(userId, mode))

    unsubscribe = onSnapshot(docRef, (snapshot) => {
      const metadata = {
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
      }

      if (!snapshot.exists()) {
        onUpdate(null, metadata)
        return
      }

      const data = snapshot.data() as Partial<DocumentData>
      const documentData: DocumentData = {
        text: data.text ?? '',
        updatedAt: data.updatedAt as Timestamp,
        rev: data.rev ?? 0,
      }

      onUpdate(documentData, metadata)
    })
  }

  setupListener().catch(() => {
    // Silently handle setup errors - the calling code should handle missing updates
  })

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }
}

// Helper function for transactional saves
async function saveWithTransaction(
  docRef: any,
  text: string,
  expectedRevision: number,
  serverTimestamp: any,
  runTransaction: any,
  db: any,
): Promise<number> {
  return runTransaction(db, async (transaction: any) => {
    const snapshot = await transaction.get(docRef)
    const currentData = snapshot.data() as Partial<DocumentData> | undefined
    const currentRevision = currentData?.rev ?? 0

    if (currentRevision !== expectedRevision) {
      throw new Error('revision-conflict')
    }

    const newRevision = currentRevision + 1

    transaction.set(
      docRef,
      {
        text,
        updatedAt: serverTimestamp(),
        rev: newRevision,
      },
      { merge: true },
    )

    return newRevision
  })
}
