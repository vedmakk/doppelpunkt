import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { AuthManager } from './AuthManager'
import {
  mockGetFirebase,
  mockAuth,
  mockOnAuthStateChanged,
  mockSignOut,
  mockSignInWithPopup,
  mockDeleteUser,
  mockGoogleAuthProvider,
  clearAllFirebaseMocks,
} from '../test/firebase-mocks'

describe('AuthManager', () => {
  let authManager: AuthManager
  let mockDispatch: ReturnType<typeof mock>

  beforeEach(() => {
    authManager = new AuthManager()
    mockDispatch = mock(() => {})

    // Reset all mocks
    clearAllFirebaseMocks()
    mockDispatch.mockClear()
  })

  afterEach(() => {
    authManager.detachAuthListener()
  })

  describe('attachAuthListener', () => {
    it('should set up auth state listener and dispatch actions on user change', async () => {
      const mockUser = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      }

      const mockUnsubscribe = mock(() => {})
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        // Simulate authenticated user
        callback(mockUser as any)
        return mockUnsubscribe
      })

      await authManager.attachAuthListener(mockDispatch)

      expect(mockGetFirebase).toHaveBeenCalled()
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        mockAuth,
        expect.any(Function),
      )
      expect(mockDispatch).toHaveBeenCalledTimes(2)

      // Check that setCloudUser was called with serialized user
      const setCloudUserCall = mockDispatch.mock.calls.find(
        (call) => call[0].type === 'cloud/setCloudUser',
      )
      expect(setCloudUserCall).toBeDefined()
      expect(setCloudUserCall![0].payload).toEqual({
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      })

      // Check that setCloudStatus was called with 'connected'
      const setCloudStatusCall = mockDispatch.mock.calls.find(
        (call) => call[0].type === 'cloud/setCloudStatus',
      )
      expect(setCloudStatusCall).toBeDefined()
      expect(setCloudStatusCall![0].payload).toBe('connected')
    })

    it('should dispatch null user and idle status when user signs out', async () => {
      const mockUnsubscribe = mock(() => {})
      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        // Simulate unauthenticated user
        callback(null)
        return mockUnsubscribe
      })

      await authManager.attachAuthListener(mockDispatch)

      expect(mockDispatch).toHaveBeenCalledTimes(2)

      // Check that setCloudUser was called with null
      const setCloudUserCall = mockDispatch.mock.calls.find(
        (call) => call[0].type === 'cloud/setCloudUser',
      )
      expect(setCloudUserCall).toBeDefined()
      expect(setCloudUserCall![0].payload).toBe(null)

      // Check that setCloudStatus was called with 'idle'
      const setCloudStatusCall = mockDispatch.mock.calls.find(
        (call) => call[0].type === 'cloud/setCloudStatus',
      )
      expect(setCloudStatusCall).toBeDefined()
      expect(setCloudStatusCall![0].payload).toBe('idle')
    })

    it('should detach previous listener before attaching new one', async () => {
      const mockUnsubscribe1 = mock(() => {})
      const mockUnsubscribe2 = mock(() => {})

      mockOnAuthStateChanged
        .mockReturnValueOnce(mockUnsubscribe1 as any)
        .mockReturnValueOnce(mockUnsubscribe2 as any)

      // Attach first listener
      await authManager.attachAuthListener(mockDispatch)
      expect(authManager.isListenerAttached()).toBe(true)

      // Attach second listener
      await authManager.attachAuthListener(mockDispatch)

      // First unsubscribe should have been called
      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(authManager.isListenerAttached()).toBe(true)
    })

    it('should handle user with partial profile information', async () => {
      const mockUser = {
        uid: 'test-uid',
        displayName: null,
        email: null,
        photoURL: null,
      }

      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(mockUser as any)
        return mock(() => {})
      })

      await authManager.attachAuthListener(mockDispatch)

      const setCloudUserCall = mockDispatch.mock.calls.find(
        (call) => call[0].type === 'cloud/setCloudUser',
      )
      expect(setCloudUserCall![0].payload).toEqual({
        uid: 'test-uid',
        displayName: null,
        email: null,
        photoURL: null,
      })
    })
  })

  describe('detachAuthListener', () => {
    it('should call unsubscribe function when listener is attached', async () => {
      const mockUnsubscribe = mock(() => {})
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe as any)

      await authManager.attachAuthListener(mockDispatch)
      expect(authManager.isListenerAttached()).toBe(true)

      authManager.detachAuthListener()

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(authManager.isListenerAttached()).toBe(false)
    })

    it('should be safe to call when no listener is attached', () => {
      expect(authManager.isListenerAttached()).toBe(false)

      // Should not throw
      expect(() => authManager.detachAuthListener()).not.toThrow()

      expect(authManager.isListenerAttached()).toBe(false)
    })

    it('should be safe to call multiple times', async () => {
      const mockUnsubscribe = mock(() => {})
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe as any)

      await authManager.attachAuthListener(mockDispatch)
      authManager.detachAuthListener()

      // Should be safe to call again
      expect(() => authManager.detachAuthListener()).not.toThrow()
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('signOut', () => {
    it('should call Firebase signOut', async () => {
      await authManager.signOut()

      expect(mockGetFirebase).toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalledWith(mockAuth)
    })

    it('should propagate Firebase errors', async () => {
      const error = new Error('Network error')
      mockSignOut.mockRejectedValueOnce(error)

      await expect(authManager.signOut()).rejects.toThrow('Network error')
    })
  })

  describe('signInWithGoogle', () => {
    it('should call Firebase signInWithPopup with Google provider', async () => {
      await authManager.signInWithGoogle()

      expect(mockGetFirebase).toHaveBeenCalled()
      expect(mockGoogleAuthProvider).toHaveBeenCalled()
      expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, {})
    })

    it('should propagate Firebase errors', async () => {
      const error = new Error('Popup blocked')
      mockSignInWithPopup.mockRejectedValueOnce(error)

      await expect(authManager.signInWithGoogle()).rejects.toThrow(
        'Popup blocked',
      )
    })
  })

  describe('deleteCurrentUser', () => {
    beforeEach(() => {
      // Reset mockAuth for each test
      mockAuth.currentUser = null
    })

    it('should delete the current user when signed in', async () => {
      const mockUser = { uid: 'test-uid' }
      mockAuth.currentUser = mockUser as any as any

      await authManager.deleteCurrentUser()

      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
    })

    it('should throw error when no user is signed in', async () => {
      mockAuth.currentUser = null

      await expect(authManager.deleteCurrentUser()).rejects.toThrow(
        'No signed-in user to delete',
      )

      expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    it('should handle requires-recent-login error by signing out', async () => {
      const mockUser = { uid: 'test-uid' }
      mockAuth.currentUser = mockUser as any as any

      const authError = new Error('Requires recent login') as any
      authError.code = 'auth/requires-recent-login'
      mockDeleteUser.mockRejectedValueOnce(authError)

      await expect(authManager.deleteCurrentUser()).rejects.toThrow(
        'Please sign in again to delete your account',
      )

      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
      expect(mockSignOut).toHaveBeenCalledWith(mockAuth)
    })

    it('should propagate other Firebase errors without modification', async () => {
      const mockUser = { uid: 'test-uid' }
      mockAuth.currentUser = mockUser as any as any

      const otherError = new Error('Network error') as any
      otherError.code = 'auth/network-error'
      mockDeleteUser.mockRejectedValueOnce(otherError)

      await expect(authManager.deleteCurrentUser()).rejects.toThrow(
        'Network error',
      )

      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should handle errors without error codes', async () => {
      const mockUser = { uid: 'test-uid' }
      mockAuth.currentUser = mockUser as any

      const genericError = new Error('Generic error')
      mockDeleteUser.mockRejectedValueOnce(genericError)

      await expect(authManager.deleteCurrentUser()).rejects.toThrow(
        'Generic error',
      )

      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser)
      expect(mockSignOut).not.toHaveBeenCalled()
    })
  })

  describe('isListenerAttached', () => {
    it('should return false initially', () => {
      expect(authManager.isListenerAttached()).toBe(false)
    })

    it('should return true after attaching listener', async () => {
      mockOnAuthStateChanged.mockReturnValue(mock(() => {}) as any)

      await authManager.attachAuthListener(mockDispatch)

      expect(authManager.isListenerAttached()).toBe(true)
    })

    it('should return false after detaching listener', async () => {
      mockOnAuthStateChanged.mockReturnValue(mock(() => {}) as any)

      await authManager.attachAuthListener(mockDispatch)
      authManager.detachAuthListener()

      expect(authManager.isListenerAttached()).toBe(false)
    })
  })

  describe('serializeUser', () => {
    it('should serialize user with all properties', async () => {
      const mockUser = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
        // Additional Firebase User properties that should be ignored
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: 'refresh-token',
        tenantId: null,
      }

      mockOnAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(mockUser as any)
        return mock(() => {})
      })

      await authManager.attachAuthListener(mockDispatch)

      const setCloudUserCall = mockDispatch.mock.calls.find(
        (call) => call[0].type === 'cloud/setCloudUser',
      )

      // Should only include the serialized properties
      expect(setCloudUserCall![0].payload).toEqual({
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      })

      // Should not include other Firebase User properties
      expect(setCloudUserCall![0].payload).not.toHaveProperty('emailVerified')
      expect(setCloudUserCall![0].payload).not.toHaveProperty('refreshToken')
    })
  })
})
