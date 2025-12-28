import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import {
  mockDeleteDoc,
  mockDoc,
  mockDeleteUser,
  mockAuth,
  clearAllFirebaseMocks,
} from '../test/firebase-mocks'
import { createStore } from '../store'
import {
  setCloudUser,
  setCloudStatus,
  setCloudEnabled,
  requestDeleteUser,
} from './cloudSlice'

// Track calls to deleteDocument from documentPersistence
const deletedDocuments: { userId: string; mode: string }[] = []
const mockDeleteDocument = mock((userId: string, mode: string) => {
  deletedDocuments.push({ userId, mode })
  return Promise.resolve()
})

// Mock the documentPersistence module to track deletion calls
mock.module('./documentPersistence', () => ({
  saveDocument: mock(() => Promise.resolve()),
  deleteDocument: mockDeleteDocument,
  loadDocument: mock(() => Promise.resolve(null)),
  listenToDocument: mock(() => () => {}),
  getDocumentPath: mock(
    (userId: string, mode: string) => `users/${userId}/doc/${mode}`,
  ),
}))

describe('cloudPersistenceMiddleware', () => {
  beforeEach(() => {
    clearAllFirebaseMocks()
    deletedDocuments.length = 0
    mockDeleteDocument.mockClear()
    // Clear localStorage to prevent state leaking between tests
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  describe('requestDeleteUser', () => {
    it('should delete all user Firestore data when account is deleted', async () => {
      const store = createStore()
      const userId = 'test-user-id'

      // Set up user as logged in
      store.dispatch(setCloudEnabled(true))
      store.dispatch(setCloudStatus('connected'))
      store.dispatch(
        setCloudUser({
          uid: userId,
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      )

      // Set up mock for currentUser (needed for deleteUser)
      const mockUser = { uid: userId }
      mockAuth.currentUser = mockUser

      // Track which paths deleteDoc was called with (for user profile and structured todos)
      const deletedPaths: string[] = []
      mockDoc.mockImplementation((_db: any, ...pathSegments: string[]) => {
        const path = pathSegments.join('/')
        return { id: path, path }
      })
      mockDeleteDoc.mockImplementation((ref: any) => {
        deletedPaths.push(ref.path)
        return Promise.resolve()
      })

      // Dispatch the delete user action
      store.dispatch(requestDeleteUser())

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify editor and todo documents were deleted via documentPersistence
      expect(deletedDocuments).toContainEqual({ userId, mode: 'editor' })
      expect(deletedDocuments).toContainEqual({ userId, mode: 'todo' })

      // Verify user profile and structured todos were deleted via direct Firestore calls
      expect(deletedPaths).toContain(`users/${userId}`)
      expect(deletedPaths).toContain(`users/${userId}/settings/structuredTodos`)
      expect(deletedPaths).toContain(`users/${userId}/structuredTodos/data`)

      // Verify Firebase auth deleteUser was called
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)

      // Verify state was cleaned up
      expect(store.getState().cloud.user).toBeNull()
      expect(store.getState().cloud.status).toBe('idle')
    })

    it('should set error when no user is signed in', async () => {
      const store = createStore()

      // Cloud is enabled but no user
      store.dispatch(setCloudEnabled(true))
      store.dispatch(setCloudStatus('idle'))

      // Dispatch the delete user action
      store.dispatch(requestDeleteUser())

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify error was set
      expect(store.getState().cloud.error).toBe('No signed-in user to delete')

      // Verify no delete operations were performed
      expect(mockDeleteDoc).not.toHaveBeenCalled()
      expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    it('should clean up state even when deletion requires re-authentication', async () => {
      const store = createStore()
      const userId = 'test-user-id'

      // Set up user as logged in
      store.dispatch(setCloudEnabled(true))
      store.dispatch(setCloudStatus('connected'))
      store.dispatch(
        setCloudUser({
          uid: userId,
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      )

      // Set up mock for currentUser
      mockAuth.currentUser = { uid: userId }

      // Make deleteUser throw requires-recent-login error
      mockDeleteUser.mockRejectedValueOnce({
        code: 'auth/requires-recent-login',
        message: 'Please sign in again to delete your account',
      })

      // Dispatch the delete user action
      store.dispatch(requestDeleteUser())

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify state was cleaned up even though auth deletion failed
      expect(store.getState().cloud.user).toBeNull()
      expect(store.getState().cloud.status).toBe('idle')

      // Verify error message mentions sign in again
      expect(store.getState().cloud.error).toContain('sign in again')
    })

    it('should delete structured todos data and settings', async () => {
      const store = createStore()
      const userId = 'test-user-id'

      // Set up user as logged in
      store.dispatch(setCloudEnabled(true))
      store.dispatch(setCloudStatus('connected'))
      store.dispatch(
        setCloudUser({
          uid: userId,
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      )

      mockAuth.currentUser = { uid: userId }

      // Track which paths deleteDoc was called with
      const deletedPaths: string[] = []
      mockDoc.mockImplementation((_db: any, ...pathSegments: string[]) => {
        const path = pathSegments.join('/')
        return { id: path, path }
      })
      mockDeleteDoc.mockImplementation((ref: any) => {
        deletedPaths.push(ref.path)
        return Promise.resolve()
      })

      // Dispatch the delete user action
      store.dispatch(requestDeleteUser())

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify structured todos paths were deleted
      expect(deletedPaths).toContain(`users/${userId}/settings/structuredTodos`)
      expect(deletedPaths).toContain(`users/${userId}/structuredTodos/data`)
    })

    it('should clear structured todos Redux state after deletion', async () => {
      const store = createStore()
      const userId = 'test-user-id'

      // Set up user as logged in
      store.dispatch(setCloudEnabled(true))
      store.dispatch(setCloudStatus('connected'))
      store.dispatch(
        setCloudUser({
          uid: userId,
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      )

      mockAuth.currentUser = { uid: userId }

      // Dispatch the delete user action
      store.dispatch(requestDeleteUser())

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify structured todos state was cleared
      const structuredTodosState = store.getState().structuredTodos
      expect(structuredTodosState.todos).toEqual([])
      expect(structuredTodosState.enabled).toBe(false)
      expect(structuredTodosState.apiKeyIsSet).toBe(false)
    })
  })
})
