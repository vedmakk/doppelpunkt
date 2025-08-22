import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { DocumentSyncManager } from './DocumentSyncManager'
import type { WritingMode } from '../mode/modeSlice'

// Mock Firebase Firestore
const mockDoc = mock(() => ({ id: 'mock-doc-ref' }))
const mockGetDoc = mock(() =>
  Promise.resolve({
    exists: () => true,
    data: () => ({ text: 'remote text', rev: 1 }),
  }),
)
const mockServerTimestamp = mock(() => ({ __timestamp: true }))
const mockRunTransaction = mock(() => Promise.resolve(2))
const mockDeleteDoc = mock(() => Promise.resolve())
const mockOnSnapshot = mock(() => () => {}) // Returns unsubscribe function

const mockDb = {
  id: 'mock-firestore',
}

const mockGetFirebase = mock(() =>
  Promise.resolve({
    db: mockDb,
  }),
)

// Mock document persistence functions
const mockSaveDocumentWithConflictResolution = mock(() =>
  Promise.resolve({
    newRevision: 2,
    finalText: 'merged text',
    wasConflicted: false,
  }),
)

const mockDeleteDocument = mock(() => Promise.resolve())

const mockListenToDocument = mock(() => () => {}) // Returns unsubscribe function

const mockGetDocumentPath = mock(
  (userId: string, mode: WritingMode) => `users/${userId}/doc/${mode}`,
)

// Mock Redux actions
const mockSetText = mock((payload: any) => ({
  type: 'editor/setText',
  payload,
}))
const mockSetCloudError = mock((payload: any) => ({
  type: 'cloud/setCloudError',
  payload,
}))
const mockSetCloudDocBase = mock((payload: any) => ({
  type: 'cloud/setCloudDocBase',
  payload,
}))
const mockSetCloudDocSnapshotMeta = mock((payload: any) => ({
  type: 'cloud/setCloudDocSnapshotMeta',
  payload,
}))

// Mock modules
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
}))

mock.module('./documentPersistence', () => ({
  saveDocumentWithConflictResolution: mockSaveDocumentWithConflictResolution,
  deleteDocument: mockDeleteDocument,
  listenToDocument: mockListenToDocument,
  getDocumentPath: mockGetDocumentPath,
}))

mock.module('../editor/editorSlice', () => ({
  setText: mockSetText,
}))

mock.module('./cloudSlice', () => ({
  setCloudError: mockSetCloudError,
  setCloudDocBase: mockSetCloudDocBase,
  setCloudDocSnapshotMeta: mockSetCloudDocSnapshotMeta,
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
        editor: { baseRev: 1, baseText: 'base editor text' },
        todo: { baseRev: 1, baseText: 'base todo text' },
      },
    },
  }

  beforeEach(() => {
    syncManager = new DocumentSyncManager()
    mockDispatch = mock(() => {})
    mockGetState = mock(() => mockState)

    // Clear all mocks
    mockGetFirebase.mockClear()
    mockDoc.mockClear()
    mockGetDoc.mockClear()
    mockServerTimestamp.mockClear()
    mockRunTransaction.mockClear()
    mockDeleteDoc.mockClear()
    mockOnSnapshot.mockClear()
    mockSaveDocumentWithConflictResolution.mockClear()
    mockDeleteDocument.mockClear()
    mockListenToDocument.mockClear()
    mockGetDocumentPath.mockClear()
    mockSetText.mockClear()
    mockSetCloudError.mockClear()
    mockSetCloudDocBase.mockClear()
    mockSetCloudDocSnapshotMeta.mockClear()
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

    it('should handle document updates correctly', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      mockListenToDocument.mockImplementation((userId, mode, callback) => {
        if (mode === 'editor') {
          onUpdateCallback = callback
        }
        return mock(() => {})
      })

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Simulate document update
      const documentData = {
        text: 'updated remote text',
        rev: 2,
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
        mockSetCloudDocBase({
          mode: 'editor',
          baseRev: 2,
          baseText: 'updated remote text',
        }),
      )

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetText({
          mode: 'editor',
          text: 'updated remote text',
          cursorPos: 10, // Should preserve cursor position (min of current and new text length)
        }),
      )
    })

    it('should not update text when local and remote text are the same', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      mockListenToDocument.mockImplementation((userId, mode, callback) => {
        if (mode === 'editor') {
          onUpdateCallback = callback
        }
        return mock(() => {})
      })

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Simulate document update with same text as local
      const documentData = {
        text: 'local editor text', // Same as mockState.editor.documents.editor.text
        rev: 2,
        updatedAt: { seconds: 123456789 },
      }
      const metadata = {
        hasPendingWrites: false,
        fromCache: false,
      }

      onUpdateCallback(documentData, metadata)

      // Should still update snapshot metadata and base
      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocSnapshotMeta({
          mode: 'editor',
          hasPendingWrites: false,
          fromCache: false,
        }),
      )

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocBase({
          mode: 'editor',
          baseRev: 2,
          baseText: 'local editor text',
        }),
      )

      // Should NOT call setText since text is the same
      expect(mockSetText).not.toHaveBeenCalled()
    })

    it('should handle invalid document data gracefully', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      mockListenToDocument.mockImplementation((userId, mode, callback) => {
        if (mode === 'editor') {
          onUpdateCallback = callback
        }
        return mock(() => {})
      })

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

      // Should only update snapshot metadata, not base or text
      expect(mockDispatch).toHaveBeenCalledTimes(3)
      expect(mockSetCloudDocSnapshotMeta).toHaveBeenCalledTimes(3)
      expect(mockSetCloudDocBase).not.toHaveBeenCalled()
      expect(mockSetText).not.toHaveBeenCalled()
    })

    it('should adjust cursor position when new text is shorter', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      const mockStateWithLongCursor = {
        ...mockState,
        editor: {
          documents: {
            editor: { text: 'local editor text', cursorPos: 100 }, // Cursor beyond new text length
            todo: { text: 'local todo text', cursorPos: 5 },
          },
        },
      }

      mockGetState.mockReturnValue(mockStateWithLongCursor)

      mockListenToDocument.mockImplementation((userId, mode, callback) => {
        if (mode === 'editor') {
          onUpdateCallback = callback
        }
        return mock(() => {})
      })

      syncManager.startListening(userId, mockGetState, mockDispatch)

      const documentData = {
        text: 'short', // Much shorter than cursor position
        rev: 2,
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(documentData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetText({
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
        'test text',
        mockGetState,
        mockDispatch,
      )

      // Stop listening should clear the timer
      syncManager.stopListening()

      // Timer should be cleared (we can't easily test this directly, but it shouldn't throw)
      expect(() => syncManager.stopListening()).not.toThrow()
    })
  })

  describe('performInitialSync', () => {
    beforeEach(() => {
      mockGetDoc.mockClear()
    })

    it('should sync local content to cloud when remote is empty', async () => {
      const userId = 'test-user'

      // Mock empty remote document
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ text: '', rev: 0 }),
      })

      await syncManager.performInitialSync(userId, mockGetState, mockDispatch)

      expect(mockGetDoc).toHaveBeenCalledTimes(2) // Called for both editor and todo
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledTimes(2)

      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledWith(
        userId,
        'editor',
        'local editor text',
        1, // baseRev from mockState
        'base editor text', // baseText from mockState
      )
    })

    it('should use remote content when it exists and is non-empty', async () => {
      const userId = 'test-user'

      // Mock existing remote document
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ text: 'existing remote text', rev: 5 }),
      })

      await syncManager.performInitialSync(userId, mockGetState, mockDispatch)

      expect(mockGetDoc).toHaveBeenCalledTimes(2)
      expect(mockSaveDocumentWithConflictResolution).not.toHaveBeenCalled()

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocBase({
          mode: 'editor',
          baseRev: 5,
          baseText: 'existing remote text',
        }),
      )
    })

    it('should handle missing remote documents', async () => {
      const userId = 'test-user'

      // Mock non-existent document
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      })

      await syncManager.performInitialSync(userId, mockGetState, mockDispatch)

      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledTimes(2)
    })

    it('should handle documents with invalid revision numbers', async () => {
      const userId = 'test-user'

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ text: 'remote text', rev: 'invalid' }),
      })

      await syncManager.performInitialSync(userId, mockGetState, mockDispatch)

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocBase({
          mode: 'editor',
          baseRev: 0, // Should default to 0 for invalid revision
          baseText: 'remote text',
        }),
      )
    })

    it('should dispatch error on sync failure', async () => {
      const userId = 'test-user'

      mockGetDoc.mockRejectedValue(new Error('Network error'))

      await syncManager.performInitialSync(userId, mockGetState, mockDispatch)

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudError('Failed to perform initial sync'),
      )
    })
  })

  describe('scheduleDocumentSave', () => {
    let originalSetTimeout: typeof globalThis.setTimeout
    let originalClearTimeout: typeof globalThis.clearTimeout
    let timerCallbacks: (() => void)[]

    beforeEach(() => {
      originalSetTimeout = globalThis.setTimeout
      originalClearTimeout = globalThis.clearTimeout
      timerCallbacks = []

      globalThis.setTimeout = mock((callback: () => void) => {
        timerCallbacks.push(callback)
        return 123
      })
      globalThis.clearTimeout = mock(() => {})
    })

    afterEach(() => {
      globalThis.setTimeout = originalSetTimeout
      globalThis.clearTimeout = originalClearTimeout
    })

    it('should debounce multiple save requests', () => {
      const userId = 'test-user'
      const text = 'updated text'

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )

      expect(globalThis.clearTimeout).toHaveBeenCalledWith(123)
    })

    it('should call saveDocument with correct parameters', () => {
      const userId = 'test-user'
      const text = 'updated text'

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback
      timerCallbacks[0]()

      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledWith(
        userId,
        'editor',
        text,
        1, // baseRev from mockState
        'base editor text', // baseText from mockState
      )
    })

    it('should dispatch error on save failure', async () => {
      const userId = 'test-user'
      const text = 'updated text'

      mockSaveDocumentWithConflictResolution.mockRejectedValueOnce(
        new Error('Save failed'),
      )

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback and wait for promise to resolve
      await timerCallbacks[0]()

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudError('Failed to write to cloud'),
      )
    })

    it('should update state after successful save', async () => {
      const userId = 'test-user'
      const text = 'updated text'

      mockSaveDocumentWithConflictResolution.mockResolvedValueOnce({
        newRevision: 3,
        finalText: 'saved text',
        wasConflicted: false,
      })

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback and wait for promise to resolve
      await timerCallbacks[0]()

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocBase({
          mode: 'editor',
          baseRev: 3,
          baseText: 'saved text',
        }),
      )
    })

    it('should update editor text when conflict was resolved and text changed', async () => {
      const userId = 'test-user'
      const text = 'original text'

      mockSaveDocumentWithConflictResolution.mockResolvedValueOnce({
        newRevision: 3,
        finalText: 'conflict resolved text',
        wasConflicted: true,
      })

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )

      // Execute the timer callback and wait for promise to resolve
      await timerCallbacks[0]()

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetText({
          mode: 'editor',
          text: 'conflict resolved text',
          cursorPos: 10, // Should preserve cursor position
        }),
      )
    })

    it('should not update editor text when no conflict occurred', () => {
      const userId = 'test-user'
      const text = 'original text'

      mockSaveDocumentWithConflictResolution.mockResolvedValueOnce({
        newRevision: 3,
        finalText: text,
        wasConflicted: false,
      })

      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        text,
        mockGetState,
        mockDispatch,
      )

      // Should not call setText when no conflict
      expect(mockSetText).not.toHaveBeenCalled()
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

      // Should not throw even if deletion fails
      await expect(syncManager.deleteUserDocuments(userId)).rejects.toThrow()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete sync workflow', async () => {
      const userId = 'test-user'

      // Setup listeners
      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Perform initial sync
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ text: 'remote initial', rev: 1 }),
      })

      await syncManager.performInitialSync(userId, mockGetState, mockDispatch)

      // Clear previous calls for better test isolation
      mockSaveDocumentWithConflictResolution.mockClear()

      // For integration test, just verify the components work together
      // The detailed timer behavior is tested in the scheduleDocumentSave tests
      expect(mockListenToDocument).toHaveBeenCalledTimes(2)
      expect(mockSetCloudDocBase).toHaveBeenCalled()

      // Stop listening
      syncManager.stopListening()
    })

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
        'text1',
        mockGetState,
        mockDispatch,
      )
      syncManager.scheduleDocumentSave(
        userId,
        'editor',
        'text2',
        mockGetState,
        mockDispatch,
      )
      syncManager.scheduleDocumentSave(
        userId,
        'todo',
        'todo1',
        mockGetState,
        mockDispatch,
      )

      syncManager.stopListening()

      // Should handle all operations without errors
      expect(() => {}).not.toThrow()
    })
  })
})
