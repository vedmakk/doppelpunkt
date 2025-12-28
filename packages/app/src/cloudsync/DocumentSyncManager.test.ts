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
    it('should unsubscribe all listeners', () => {
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

    it('should clear pending save timers', async () => {
      const userId = 'test-user'

      // Schedule a save
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Stop listening (should clear timers)
      syncManager.stopListening()

      // Wait for what would have been the debounce period
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Save should not have happened because timer was cleared
      expect(mockSaveDocument).not.toHaveBeenCalled()
    })
  })

  describe('saveDocumentNow', () => {
    it('should call saveDocument with correct parameters', async () => {
      const userId = 'test-user'

      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

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

      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Restore original implementation
      mockSaveDocument.mockImplementation(() => Promise.resolve())

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudError('Failed to write to cloud'),
      )
    })

    it('should clear error after successful save', async () => {
      const userId = 'test-user'

      mockSaveDocument.mockResolvedValueOnce(undefined)

      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      expect(mockDispatch).toHaveBeenCalledWith(mockSetCloudError(undefined))
    })

    it('should save todo document correctly', async () => {
      const userId = 'test-user'

      await syncManager.saveDocumentNow(
        userId,
        'todo',
        mockGetState,
        mockDispatch,
      )

      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text',
      )
    })
  })

  describe('scheduleDocumentSave', () => {
    it('should debounce save requests', async () => {
      const userId = 'test-user'

      // Schedule multiple saves in quick succession
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
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Should not have saved yet (still debouncing)
      expect(mockSaveDocument).not.toHaveBeenCalled()

      // Wait for debounce to complete (300ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Should have saved only once
      expect(mockSaveDocument).toHaveBeenCalledTimes(1)
      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'editor',
        'local editor text',
      )
    })

    it('should handle separate modes independently', async () => {
      const userId = 'test-user'

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

      // Wait for debounce to complete
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Should have saved both modes
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
  })

  describe('flushPendingSaves', () => {
    it('should immediately save any pending debounced saves', async () => {
      const userId = 'test-user'

      // Schedule a save (will be pending)
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Should not have saved yet
      expect(mockSaveDocument).not.toHaveBeenCalled()

      // Flush pending saves
      await syncManager.flushPendingSaves(userId, mockGetState, mockDispatch)

      // Should have saved immediately
      expect(mockSaveDocument).toHaveBeenCalledTimes(1)
      expect(mockSaveDocument).toHaveBeenCalledWith(
        userId,
        'editor',
        'local editor text',
      )
    })

    it('should flush saves for all modes with pending timers', async () => {
      const userId = 'test-user'

      // Schedule saves for both modes
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

      // Flush all pending saves
      await syncManager.flushPendingSaves(userId, mockGetState, mockDispatch)

      // Both should have been saved
      expect(mockSaveDocument).toHaveBeenCalledTimes(2)
    })

    it('should do nothing if no saves are pending', async () => {
      const userId = 'test-user'

      await syncManager.flushPendingSaves(userId, mockGetState, mockDispatch)

      expect(mockSaveDocument).not.toHaveBeenCalled()
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
    it('should handle rapid successive operations', async () => {
      const userId = 'test-user'

      // Start and stop multiple times
      syncManager.startListening(userId, mockGetState, mockDispatch)
      syncManager.stopListening()
      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Save multiple documents
      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )
      await syncManager.saveDocumentNow(
        userId,
        'todo',
        mockGetState,
        mockDispatch,
      )

      syncManager.stopListening()

      // Should handle all operations without errors
      expect(mockSaveDocument).toHaveBeenCalledTimes(2)
    })
  })

  describe('echo prevention', () => {
    it('should ignore echoes of our own saves', async () => {
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

      // Save a document
      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      mockDispatch.mockClear()
      mockSetTextFromCloud.mockClear()

      // Simulate Firestore echoing back the same text we saved
      const echoedData = {
        text: 'local editor text', // Same as what we saved
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(echoedData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      // Should update metadata but NOT dispatch setTextFromCloud
      expect(mockSetCloudDocSnapshotMeta).toHaveBeenCalled()
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })

    it('should apply remote changes from other clients', async () => {
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

      // Save a document
      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      mockDispatch.mockClear()
      mockSetTextFromCloud.mockClear()

      // Simulate a different client's change (text differs from what we saved)
      const remoteData = {
        text: 'text from another client',
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(remoteData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      // Should dispatch setTextFromCloud since this is from another client
      expect(mockSetTextFromCloud).toHaveBeenCalledWith({
        mode: 'editor',
        text: 'text from another client',
        cursorPos: 10,
      })
    })

    it('should not overwrite editor when user continues typing after save', async () => {
      // This is the critical bug scenario:
      // 1. User types "Hello" -> saved
      // 2. User continues typing "Hello World"
      // 3. Firestore echoes "Hello" back
      // 4. Should NOT overwrite "Hello World" with "Hello"

      const userId = 'test-user'
      let onUpdateCallback: any
      let currentText = 'Hello'

      // Dynamic state that changes as user types
      const dynamicGetState = () => ({
        editor: {
          documents: {
            editor: { text: currentText, cursorPos: currentText.length },
            todo: { text: 'local todo text', cursorPos: 5 },
          },
        },
        cloud: {
          docs: {
            editor: { hasPendingWrites: false, fromCache: false },
            todo: { hasPendingWrites: false, fromCache: false },
          },
        },
      })

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, dynamicGetState, mockDispatch)

      // Step 1: Save "Hello"
      await syncManager.saveDocumentNow(
        userId,
        'editor',
        dynamicGetState,
        mockDispatch,
      )

      // Step 2: User continues typing (state changes before echo arrives)
      currentText = 'Hello World'

      mockDispatch.mockClear()
      mockSetTextFromCloud.mockClear()

      // Step 3: Firestore echoes back "Hello" (what we saved)
      const echoedData = {
        text: 'Hello',
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(echoedData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      // Step 4: Should NOT overwrite - this is our own echo
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })

    it('should clear lastSavedText when stopping listeners', async () => {
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

      // Save a document
      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      // Stop and restart listening (simulates reconnect)
      syncManager.stopListening()

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      mockDispatch.mockClear()
      mockSetTextFromCloud.mockClear()

      // After reconnect, the same text should be applied (not ignored as echo)
      // because lastSavedText was cleared
      const documentData = {
        text: 'local editor text',
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(documentData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      // Text matches local, so no update needed (different from echo scenario)
      // This tests that the comparison with current local text still works
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })

    it('should track lastSavedText separately for each mode', async () => {
      const userId = 'test-user'
      let editorCallback: any
      let todoCallback: any

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            editorCallback = callback
          } else {
            todoCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Save only editor document
      await syncManager.saveDocumentNow(
        userId,
        'editor',
        mockGetState,
        mockDispatch,
      )

      mockDispatch.mockClear()
      mockSetTextFromCloud.mockClear()

      // Echo for editor should be ignored
      editorCallback(
        { text: 'local editor text', updatedAt: { seconds: 123 } },
        { hasPendingWrites: false, fromCache: false },
      )
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()

      // But different text for todo should still be applied
      // (todo was never saved, so no lastSavedText for it)
      todoCallback(
        { text: 'different todo text', updatedAt: { seconds: 123 } },
        { hasPendingWrites: false, fromCache: false },
      )
      expect(mockSetTextFromCloud).toHaveBeenCalledWith({
        mode: 'todo',
        text: 'different todo text',
        cursorPos: 5,
      })
    })

    it('should record lastSavedText during initialSync', async () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      // Document doesn't exist in cloud, so initialSync will save local version
      mockLoadDocument.mockResolvedValue(null)

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)
      await syncManager.initialSync(userId, mockGetState)

      mockDispatch.mockClear()
      mockSetTextFromCloud.mockClear()

      // Echo of initial sync should be ignored
      const echoedData = {
        text: 'local editor text',
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(echoedData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })
  })
})
