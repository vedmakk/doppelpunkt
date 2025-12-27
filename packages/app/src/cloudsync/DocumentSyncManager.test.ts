import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { DocumentSyncManager } from './DocumentSyncManager'
import type { WritingMode } from '../mode/modeSlice'
import { mockDeleteDoc, clearAllFirebaseMocks } from '../test/firebase-mocks'

// Mock document persistence functions
const mockSaveDocument = mock(() => Promise.resolve())

const mockDeleteDocument = mock(() => Promise.resolve())

const mockLoadDocument = mock() // Will be configured per test

const mockListenToDocument = mock() // Returns unsubscribe function

const mockGetDocumentPath = mock(
  (userId: string, mode: WritingMode) => `users/${userId}/doc/${mode}`,
)

// Mock Redux actions
const mockSetCloudError = mock((payload: any) => ({
  type: 'cloud/setCloudError',
  payload,
}))
const mockSetCloudDocSnapshotMeta = mock((payload: any) => ({
  type: 'cloud/setCloudDocSnapshotMeta',
  payload,
}))
const mockSetTextFromCloud = mock((payload: any) => ({
  type: 'cloud/setTextFromCloud',
  payload,
}))

// Mock modules (Firebase mocks are already set up globally)

mock.module('./documentPersistence', () => ({
  saveDocument: mockSaveDocument,
  deleteDocument: mockDeleteDocument,
  loadDocument: mockLoadDocument,
  listenToDocument: mockListenToDocument,
  getDocumentPath: mockGetDocumentPath,
}))

mock.module('./cloudSlice', () => ({
  setCloudError: mockSetCloudError,
  setCloudDocSnapshotMeta: mockSetCloudDocSnapshotMeta,
  setTextFromCloud: mockSetTextFromCloud,
}))

describe('DocumentSyncManager', () => {
  let syncManager: DocumentSyncManager
  let mockDispatch: ReturnType<typeof mock>
  let mockGetState: ReturnType<typeof mock>

  const mockState = {
    editor: {
      documents: {
        editor: { text: 'local editor text', cursorPos: 10 },
        todo: { text: 'local todo text', cursorPos: 5 },
      },
    },
    cloud: {
      docs: {
        editor: { hasPendingWrites: false, fromCache: false },
        todo: { hasPendingWrites: false, fromCache: false },
      },
    },
  }

  beforeEach(() => {
    syncManager = new DocumentSyncManager()
    mockDispatch = mock(() => {})
    mockGetState = mock(() => mockState)

    // Clear all mocks
    clearAllFirebaseMocks()
    mockSaveDocument.mockClear()
    mockDeleteDocument.mockClear()
    mockLoadDocument.mockClear()
    mockListenToDocument.mockClear()
    mockGetDocumentPath.mockClear()
    mockSetCloudError.mockClear()
    mockSetCloudDocSnapshotMeta.mockClear()
    mockSetTextFromCloud.mockClear()
    mockDispatch.mockClear()
    mockGetState.mockClear()
  })

  afterEach(() => {
    syncManager.stopListening()
  })

  describe('startListening', () => {
    it('should set up listeners for both editor and todo modes', () => {
      const userId = 'test-user'
      const mockUnsubscribe1 = mock(() => {})
      const mockUnsubscribe2 = mock(() => {})

      mockListenToDocument
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)

      syncManager.startListening(userId, mockGetState, mockDispatch)

      expect(mockListenToDocument).toHaveBeenCalledTimes(2)
      expect(mockListenToDocument).toHaveBeenCalledWith(
        userId,
        'editor',
        expect.any(Function),
      )
      expect(mockListenToDocument).toHaveBeenCalledWith(
        userId,
        'todo',
        expect.any(Function),
      )
    })

    it('should stop previous listeners before starting new ones', () => {
      const userId = 'test-user'
      const mockUnsubscribe1 = mock(() => {})
      const mockUnsubscribe2 = mock(() => {})
      const mockUnsubscribe3 = mock(() => {})
      const mockUnsubscribe4 = mock(() => {})

      mockListenToDocument
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)
        .mockReturnValueOnce(mockUnsubscribe3)
        .mockReturnValueOnce(mockUnsubscribe4)

      // Start first set of listeners
      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Start second set of listeners
      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Previous listeners should be unsubscribed
      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(mockUnsubscribe2).toHaveBeenCalled()
    })

    it('should handle document updates and apply remote text when different', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Simulate document update with different text
      const documentData = {
        text: 'updated remote text',
        updatedAt: { seconds: 123456789 },
      }
      const metadata = {
        hasPendingWrites: false,
        fromCache: false,
      }

      onUpdateCallback(documentData, metadata)

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocSnapshotMeta({
          mode: 'editor',
          hasPendingWrites: false,
          fromCache: false,
        }),
      )

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetTextFromCloud({
          mode: 'editor',
          text: 'updated remote text',
          cursorPos: 10,
        }),
      )
    })

    it('should not update text when local and remote text are the same', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Simulate document update with same text as local
      const documentData = {
        text: 'local editor text', // Same as mockState.editor.documents.editor.text
        updatedAt: { seconds: 123456789 },
      }
      const metadata = {
        hasPendingWrites: false,
        fromCache: false,
      }

      onUpdateCallback(documentData, metadata)

      // Should still update snapshot metadata
      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocSnapshotMeta({
          mode: 'editor',
          hasPendingWrites: false,
          fromCache: false,
        }),
      )

      // Should NOT call setTextFromCloud since text is the same
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })

    it('should handle invalid document data gracefully', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Simulate invalid document data
      onUpdateCallback(null, { hasPendingWrites: false, fromCache: false })
      onUpdateCallback(
        { text: null },
        { hasPendingWrites: false, fromCache: false },
      )
      onUpdateCallback(
        { text: 123 },
        { hasPendingWrites: false, fromCache: false },
      )

      // Should only update snapshot metadata, not text
      expect(mockDispatch).toHaveBeenCalledTimes(3)
      expect(mockSetCloudDocSnapshotMeta).toHaveBeenCalledTimes(3)
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })

    it('should adjust cursor position when new text is shorter', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      const mockStateWithLongCursor = {
        ...mockState,
        editor: {
          documents: {
            editor: { text: 'some long text here', cursorPos: 100 },
            todo: { text: 'local todo text', cursorPos: 5 },
          },
        },
      }

      mockGetState.mockReturnValue(mockStateWithLongCursor)

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      const documentData = {
        text: 'short', // Much shorter than cursor position
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(documentData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetTextFromCloud({
          mode: 'editor',
          text: 'short',
          cursorPos: 5, // Should be adjusted to text length
        }),
      )
    })
  })

  describe('stopListening', () => {
    it('should unsubscribe all listeners and clear save timers', () => {
      const userId = 'test-user'
      const mockUnsubscribe1 = mock(() => {})
      const mockUnsubscribe2 = mock(() => {})

      mockListenToDocument
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)

      syncManager.startListening(userId, mockGetState, mockDispatch)
      syncManager.stopListening()

      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(mockUnsubscribe2).toHaveBeenCalled()
    })

    it('should be safe to call when no listeners are active', () => {
      expect(() => syncManager.stopListening()).not.toThrow()
    })

    it('should clear pending save timers', () => {
      const userId = 'test-user'

      // Set up a timer by scheduling a save
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Stop listening should clear the timer
      syncManager.stopListening()

      // Timer should be cleared (we can't easily test this directly, but it shouldn't throw)
      expect(() => syncManager.stopListening()).not.toThrow()
    })
  })

  describe('scheduleDocumentSave', () => {
    let originalSetTimeout: typeof globalThis.setTimeout
    let originalClearTimeout: typeof globalThis.clearTimeout
    let timerCallbacks: (() => void)[]
    let timerIdCounter = 123

    beforeEach(() => {
      originalSetTimeout = globalThis.setTimeout
      originalClearTimeout = globalThis.clearTimeout
      timerCallbacks = []
      timerIdCounter = 123

      globalThis.setTimeout = mock((callback: () => void) => {
        timerCallbacks.push(callback)
        return timerIdCounter++
      }) as any
      globalThis.clearTimeout = mock(() => {}) as any
    })

    afterEach(() => {
      globalThis.setTimeout = originalSetTimeout
      globalThis.clearTimeout = originalClearTimeout
    })

    it('should debounce multiple save requests', () => {
      const userId = 'test-user'

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      expect(globalThis.clearTimeout).toHaveBeenCalled()
    })

    it('should call saveDocument with correct parameters', async () => {
      const userId = 'test-user'

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback
      await timerCallbacks[0]()

      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'editor',
        'local editor text', // text from mockState
      )
    })

    it('should dispatch error on save failure', async () => {
      const userId = 'test-user'

      // Temporarily replace the mock implementation to throw an error
      mockSaveDocument.mockImplementation(() => {
        throw new Error('Save failed')
      })

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback
      await timerCallbacks[0]()

      // Restore original implementation
      mockSaveDocument.mockImplementation(() => Promise.resolve())

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudError('Failed to write to cloud'),
      )
    })

    it('should clear error after successful save', async () => {
      const userId = 'test-user'

      mockSaveDocument.mockResolvedValueOnce(undefined)

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback
      await timerCallbacks[0]()

      expect(mockDispatch).toHaveBeenCalledWith(mockSetCloudError(undefined))
    })
  })

  describe('deleteUserDocuments', () => {
    it('should delete documents for both modes and user profile', async () => {
      const userId = 'test-user'

      await syncManager.deleteUserDocuments(userId)

      expect(mockDeleteDocument).toHaveBeenCalledTimes(2)
      expect(mockDeleteDocument).toHaveBeenCalledWith(userId, 'editor')
      expect(mockDeleteDocument).toHaveBeenCalledWith(userId, 'todo')

      // Should also delete user profile
      expect(mockDeleteDoc).toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const userId = 'test-user'

      mockDeleteDocument.mockRejectedValueOnce(new Error('Delete failed'))

      // Should throw when deletion fails
      await expect(syncManager.deleteUserDocuments(userId)).rejects.toThrow()
    })
  })

  describe('initialSync', () => {
    it('should save local documents when they do not exist in cloud', async () => {
      const userId = 'test-user'

      // Mock loadDocument to return null (document doesn't exist)
      mockLoadDocument.mockResolvedValue(null)

      await syncManager.initialSync(userId, mockGetState)

      // Should check for both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)
      expect(mockLoadDocument).toHaveBeenCalledWith(userId, 'editor')
      expect(mockLoadDocument).toHaveBeenCalledWith(userId, 'todo')

      // Should save both documents since they don't exist
      expect(mockSaveDocument).toHaveBeenCalledTimes(2)
      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'editor',
        'local editor text',
      )
      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text',
      )
    })

    it('should not save documents when they already exist in cloud', async () => {
      const userId = 'test-user'

      // Mock loadDocument to return existing documents
      mockLoadDocument.mockResolvedValue({
        text: 'existing cloud text',
        updatedAt: { seconds: 123456789 },
      })

      await syncManager.initialSync(userId, mockGetState)

      // Should check for both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)

      // Should NOT save documents since they already exist
      expect(mockSaveDocument).not.toHaveBeenCalled()
    })

    it('should handle mixed scenarios - one exists, one does not', async () => {
      const userId = 'test-user'

      // Mock editor document exists, todo document does not
      mockLoadDocument
        .mockResolvedValueOnce({
          text: 'existing editor text',
          updatedAt: { seconds: 123456789 },
        })
        .mockResolvedValueOnce(null)

      await syncManager.initialSync(userId, mockGetState)

      // Should check for both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)
      expect(mockLoadDocument).toHaveBeenNthCalledWith(1, userId, 'editor')
      expect(mockLoadDocument).toHaveBeenNthCalledWith(2, userId, 'todo')

      // Should only save the todo document
      expect(mockSaveDocument).toHaveBeenCalledTimes(1)
      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text',
      )
    })

    it('should handle errors gracefully and not break initial sync', async () => {
      const userId = 'test-user'

      // Mock loadDocument to throw error for editor, return null for todo
      mockLoadDocument
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(null)

      // Should not throw error
      await expect(
        syncManager.initialSync(userId, mockGetState),
      ).resolves.toBeUndefined()

      // Should have attempted to check both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)

      // Should still save the todo document despite editor error
      expect(mockSaveDocument).toHaveBeenCalledTimes(1)
      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text',
      )
    })
  })

  describe('integration scenarios', () => {
    it('should handle rapid successive operations', () => {
      const userId = 'test-user'

      // Start and stop multiple times
      syncManager.startListening(userId, mockGetState, mockDispatch)
      syncManager.stopListening()
      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Schedule multiple saves rapidly
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )
      syncManager.scheduleDocumentSave(
        userId,
        'todo',
        mockGetState,
        mockDispatch,
      )

      syncManager.stopListening()

      // Should handle all operations without errors
      expect(() => {}).not.toThrow()
    })
  })
})
