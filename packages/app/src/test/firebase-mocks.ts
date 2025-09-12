import { mock } from 'bun:test'

export const mockDb = {
  id: 'mock-firestore',
}

// Firebase Auth mocks
export const mockAuth = {
  currentUser: null,
} as any

// Create mocks without initial implementations
export const mockGetFirebase = mock()
export const mockDoc = mock()
export const mockGetDoc = mock()
export const mockServerTimestamp = mock()
export const mockRunTransaction = mock()
export const mockSetDoc = mock()
export const mockDeleteDoc = mock()
export const mockOnSnapshot = mock()
export const mockOnAuthStateChanged = mock()
export const mockSignOut = mock()
export const mockSignInWithPopup = mock()
export const mockDeleteUser = mock()
export const mockGoogleAuthProvider = mock()

// Initialize all Firebase mocks with their default implementations
const initializeAllFirebaseMocks = () => {
  mockGetFirebase.mockImplementation(() =>
    Promise.resolve({
      db: mockDb,
      auth: mockAuth,
    }),
  )
  mockDoc.mockImplementation(() => ({ id: 'mock-doc-ref' }))
  mockGetDoc.mockImplementation(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ text: 'remote text', rev: 1 }),
    }),
  )
  mockServerTimestamp.mockImplementation(() => ({ __timestamp: true }))
  mockRunTransaction.mockImplementation(() => Promise.resolve(2))
  mockSetDoc.mockImplementation(() => Promise.resolve())
  mockDeleteDoc.mockImplementation(() => Promise.resolve())
  mockOnSnapshot.mockImplementation(() => () => {}) // Returns unsubscribe function
  // mockOnAuthStateChanged has no default implementation
  mockSignOut.mockImplementation(() => Promise.resolve())
  mockSignInWithPopup.mockImplementation(() => Promise.resolve())
  mockDeleteUser.mockImplementation(() => Promise.resolve())
  mockGoogleAuthProvider.mockImplementation(() => ({}))
}

// Initialize mocks on module load
initializeAllFirebaseMocks()

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

// Helper function to reset all Firebase mocks to their default implementations
export const clearAllFirebaseMocks = () => {
  // Reset all mocks
  mockGetFirebase.mockReset()
  mockDoc.mockReset()
  mockGetDoc.mockReset()
  mockServerTimestamp.mockReset()
  mockRunTransaction.mockReset()
  mockSetDoc.mockReset()
  mockDeleteDoc.mockReset()
  mockOnSnapshot.mockReset()
  mockOnAuthStateChanged.mockReset()
  mockSignOut.mockReset()
  mockSignInWithPopup.mockReset()
  mockDeleteUser.mockReset()
  mockGoogleAuthProvider.mockReset()

  // Reinitialize all mocks with their default implementations
  initializeAllFirebaseMocks()
}
