import { mock } from 'bun:test'

// Firebase Firestore mocks
export const mockDoc = mock(() => ({ id: 'mock-doc-ref' }))
export const mockGetDoc = mock(() =>
  Promise.resolve({
    exists: () => true,
    data: () => ({ text: 'remote text', rev: 1 }),
  }),
)
export const mockServerTimestamp = mock(() => ({ __timestamp: true }))
export const mockRunTransaction = mock(() => Promise.resolve(2))
export const mockSetDoc = mock(() => Promise.resolve())
export const mockDeleteDoc = mock(() => Promise.resolve())
export const mockOnSnapshot = mock(() => () => {}) // Returns unsubscribe function

export const mockDb = {
  id: 'mock-firestore',
}

export const mockGetFirebase = mock(() =>
  Promise.resolve({
    db: mockDb,
    auth: mockAuth,
  }),
)

// Firebase Auth mocks
export const mockAuth = {
  currentUser: null,
} as any

export const mockOnAuthStateChanged = mock()
export const mockSignOut = mock(() => Promise.resolve())
export const mockSignInWithPopup = mock(() => Promise.resolve())
export const mockDeleteUser = mock(() => Promise.resolve())
export const mockGoogleAuthProvider = mock(() => ({}))

// Global module mocks - these will be applied to all tests
mock.module('../cloudsync/firebase', () => ({
  getFirebase: mockGetFirebase,
}))

mock.module('./cloudsync/firebase', () => ({
  getFirebase: mockGetFirebase,
}))

mock.module('../firebase', () => ({
  getFirebase: mockGetFirebase,
}))

mock.module('./firebase', () => ({
  getFirebase: mockGetFirebase,
}))

mock.module('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  serverTimestamp: mockServerTimestamp,
  runTransaction: mockRunTransaction,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  setDoc: mockSetDoc,
}))

mock.module('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut,
  signInWithPopup: mockSignInWithPopup,
  deleteUser: mockDeleteUser,
  GoogleAuthProvider: mockGoogleAuthProvider,
}))

// Helper function to clear all Firebase mocks
export const clearAllFirebaseMocks = () => {
  mockGetFirebase.mockClear()
  mockDoc.mockClear()
  mockGetDoc.mockClear()
  mockServerTimestamp.mockClear()
  mockRunTransaction.mockClear()
  mockSetDoc.mockClear()
  mockDeleteDoc.mockClear()
  mockOnSnapshot.mockClear()
  mockOnAuthStateChanged.mockClear()
  mockSignOut.mockClear()
  mockSignInWithPopup.mockClear()
  mockDeleteUser.mockClear()
  mockGoogleAuthProvider.mockClear()
}
