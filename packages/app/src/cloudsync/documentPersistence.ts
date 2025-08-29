// Document persistence layer for Firestore operations
// Handles saving, loading, and syncing documents with conflict resolution

import {
  type Timestamp,
  doc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
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

  const docRef = doc(db, getDocumentPath(userId, mode))

  // First attempt: try to save with expected revision
  try {
    return await saveDocument(userId, mode, localText, expectedRevision)
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
  const { newRevision, finalText } = await saveDocument(
    userId,
    mode,
    resolution.mergedText,
    remoteRevision,
  )

  return {
    newRevision,
    finalText,
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

async function saveDocument(
  userId: string,
  mode: WritingMode,
  text: string,
  expectedRevision: number,
): Promise<SaveResult> {
  const currentDoc = await loadDocument(userId, mode)

  if (currentDoc && currentDoc.rev !== expectedRevision) {
    throw new Error('revision-conflict')
  }

  const newRevision = (currentDoc?.rev ?? 0) + 1

  const { db } = await getFirebase()

  const docRef = doc(db, getDocumentPath(userId, mode))

  await setDoc(docRef, {
    text,
    updatedAt: serverTimestamp(),
    rev: newRevision,
  })

  return {
    newRevision,
    finalText: text,
    wasConflicted: false,
  }
}
