// Document persistence layer for Firestore operations
// Simple last-write-wins using Firebase SDK

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
import { type WritingMode } from '../mode/modeSlice'

export interface DocumentData {
  text: string
  updatedAt: Timestamp
}

/**
 * Creates the Firestore document path for a user's document
 */
export function getDocumentPath(userId: string, mode: WritingMode): string {
  return `users/${userId}/doc/${mode}`
}

/**
 * Saves a document to Firestore using last-write-wins
 */
export async function saveDocument(
  userId: string,
  mode: WritingMode,
  text: string,
): Promise<void> {
  const { db } = await getFirebase()
  const docRef = doc(db, getDocumentPath(userId, mode))

  await setDoc(
    docRef,
    {
      text,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
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
