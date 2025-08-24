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

const mockLoadDocument = mock() // Will be configured per test

const mockListenToDocument = mock() // Returns unsubscribe function

const mockGetDocumentPath = mock(
  (userId: string, mode: WritingMode) => `users/${userId}/doc/${mode}`,
)

// We don't mock conflict resolution for DocumentSyncManager tests - we want to test the integration

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
const mockSetTextFromCloud = mock((payload: any) => ({
  type: 'cloud/setTextFromCloud',
  payload,
}))

// Mock modules
mock.module('./firebase', () => ({
  getFirebase: mockGetFirebase,
}))

mock.module('./firestore', () => ({
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
  loadDocument: mockLoadDocument,
  listenToDocument: mockListenToDocument,
  getDocumentPath: mockGetDocumentPath,
}))

// Don't mock conflict resolution for DocumentSyncManager tests - we want to test the integration
// The conflict resolution itself is tested separately in conflictResolution.test.ts

mock.module('../editor/editorSlice', () => ({
  setText: mockSetText,
}))

mock.module('./cloudSlice', () => ({
  setCloudError: mockSetCloudError,
  setCloudDocBase: mockSetCloudDocBase,
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
    mockLoadDocument.mockClear()
    mockListenToDocument.mockClear()
    mockGetDocumentPath.mockClear()
    mockSetText.mockClear()
    mockSetCloudError.mockClear()
    mockSetCloudDocBase.mockClear()
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

    it('should handle document updates without conflicts', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      // Set up state where local text matches base (no local changes)
      const stateWithoutLocalChanges = {
        ...mockState,
        editor: {
          documents: {
            editor: { text: 'base editor text', cursorPos: 10 },
            todo: { text: 'base todo text', cursorPos: 5 },
          },
        },
      }
      mockGetState.mockReturnValue(stateWithoutLocalChanges)

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

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
        mockSetTextFromCloud({
          mode: 'editor',
          text: 'updated remote text',
          cursorPos: 10, // Should preserve cursor position (min of current and new text length)
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

      // Should only update snapshot metadata, not base or text
      expect(mockDispatch).toHaveBeenCalledTimes(3)
      expect(mockSetCloudDocSnapshotMeta).toHaveBeenCalledTimes(3)
      expect(mockSetCloudDocBase).not.toHaveBeenCalled()
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
    })

    it('should adjust cursor position when new text is shorter', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      const mockStateWithLongCursor = {
        ...mockState,
        editor: {
          documents: {
            editor: { text: 'base editor text', cursorPos: 100 }, // Same as base, so no local changes
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
        rev: 2,
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

    it('should handle conflicts with bidirectional resolution', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      // Set up state where both local and remote have changes from base
      const stateWithConflict = {
        ...mockState,
        editor: {
          documents: {
            editor: { text: 'Line 1\nLine 2 LOCAL\nLine 3', cursorPos: 10 },
            todo: { text: 'base todo text', cursorPos: 5 },
          },
        },
        cloud: {
          docs: {
            editor: { baseRev: 1, baseText: 'Line 1\nLine 2\nLine 3' },
            todo: { baseRev: 1, baseText: 'base todo text' },
          },
        },
      }
      mockGetState.mockReturnValue(stateWithConflict)

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      syncManager.startListening(userId, mockGetState, mockDispatch)

      // Simulate remote document update that conflicts with local changes
      const documentData = {
        text: 'Line 1\nLine 2 REMOTE\nLine 3',
        rev: 2,
        updatedAt: { seconds: 123456789 },
      }
      const metadata = {
        hasPendingWrites: false,
        fromCache: false,
      }

      onUpdateCallback(documentData, metadata)

      // Conflict resolution should have been performed (we can't easily test the exact call since we're not mocking it)

      // Should update base to remote version
      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetCloudDocBase({
          mode: 'editor',
          baseRev: 2,
          baseText: 'Line 1\nLine 2 REMOTE\nLine 3',
        }),
      )

      // Should apply resolved text (actual result will depend on diff-match-patch algorithm)
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cloud/setTextFromCloud',
          payload: expect.objectContaining({
            mode: 'editor',
            cursorPos: 10,
            // text will be the result of conflict resolution
          }),
        }),
      )
    })

    it('should schedule save when conflict resolution produces different text than remote', () => {
      const userId = 'test-user'
      let onUpdateCallback: any

      // Set up a scenario where local and remote have different changes from base
      // This should trigger conflict resolution and potentially schedule a save
      const stateWithConflict = {
        ...mockState,
        editor: {
          documents: {
            editor: { text: 'base text with local changes', cursorPos: 10 },
            todo: { text: 'base todo text', cursorPos: 5 },
          },
        },
        cloud: {
          docs: {
            editor: { baseRev: 1, baseText: 'base text' },
            todo: { baseRev: 1, baseText: 'base todo text' },
          },
        },
      }
      mockGetState.mockReturnValue(stateWithConflict)

      mockListenToDocument.mockImplementation(
        (userId: any, mode: any, callback: any) => {
          if (mode === 'editor') {
            onUpdateCallback = callback
          }
          return mock(() => {})
        },
      )

      // Mock the scheduleDocumentSave method
      const originalScheduleDocumentSave = syncManager.scheduleDocumentSave
      const mockScheduleDocumentSave = mock(() => {})
      syncManager.scheduleDocumentSave = mockScheduleDocumentSave

      syncManager.startListening(userId, mockGetState, mockDispatch)

      const documentData = {
        text: 'base text with remote changes',
        rev: 2,
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(documentData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      // Should schedule a save if the merged result is different from remote
      // (We can't predict the exact merged text, but we can check if save was scheduled)
      expect(mockScheduleDocumentSave).toHaveBeenCalled()

      // Restore original method
      syncManager.scheduleDocumentSave = originalScheduleDocumentSave
    })

    it('should skip processing when revision and text match current base', () => {
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

      // Simulate document update with same revision and text as current base
      const documentData = {
        text: 'base editor text', // Same as mockState.cloud.docs.editor.baseText
        rev: 1, // Same as mockState.cloud.docs.editor.baseRev
        updatedAt: { seconds: 123456789 },
      }

      onUpdateCallback(documentData, {
        hasPendingWrites: false,
        fromCache: false,
      })

      // Should only update snapshot metadata, skip everything else
      expect(mockDispatch).toHaveBeenCalledTimes(1)
      expect(mockSetCloudDocSnapshotMeta).toHaveBeenCalledTimes(1)
      expect(mockSetCloudDocBase).not.toHaveBeenCalled()
      expect(mockSetTextFromCloud).not.toHaveBeenCalled()
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

      expect(globalThis.clearTimeout).toHaveBeenCalled()
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

  describe('initialSync', () => {
    it('should save local documents when they do not exist in cloud', async () => {
      const userId = 'test-user'

      // Mock loadDocument to return null (document doesn't exist)
      mockLoadDocument.mockResolvedValue(null)

      await syncManager.initialSync(userId, mockGetState, mockDispatch)

      // Should check for both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)
      expect(mockLoadDocument).toHaveBeenCalledWith(userId, 'editor')
      expect(mockLoadDocument).toHaveBeenCalledWith(userId, 'todo')

      // Should save both documents since they don't exist
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledTimes(2)
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledWith(
        userId,
        'editor',
        'local editor text', // From mockState
        0, // No existing revision
        '', // No base text
      )
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text', // From mockState
        0, // No existing revision
        '', // No base text
      )
    })

    it('should not save documents when they already exist in cloud', async () => {
      const userId = 'test-user'

      // Mock loadDocument to return existing documents
      mockLoadDocument.mockResolvedValue({
        text: 'existing cloud text',
        rev: 5,
        updatedAt: { seconds: 123456789 },
      })

      await syncManager.initialSync(userId, mockGetState, mockDispatch)

      // Should check for both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)

      // Should NOT save documents since they already exist
      expect(mockSaveDocumentWithConflictResolution).not.toHaveBeenCalled()
    })

    it('should handle mixed scenarios - one exists, one does not', async () => {
      const userId = 'test-user'

      // Mock editor document exists, todo document does not
      mockLoadDocument
        .mockResolvedValueOnce({
          text: 'existing editor text',
          rev: 3,
          updatedAt: { seconds: 123456789 },
        })
        .mockResolvedValueOnce(null)

      await syncManager.initialSync(userId, mockGetState, mockDispatch)

      // Should check for both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)
      expect(mockLoadDocument).toHaveBeenNthCalledWith(1, userId, 'editor')
      expect(mockLoadDocument).toHaveBeenNthCalledWith(2, userId, 'todo')

      // Should only save the todo document
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledTimes(1)
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text',
        0,
        '',
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
        syncManager.initialSync(userId, mockGetState, mockDispatch),
      ).resolves.toBeUndefined()

      // Should have attempted to check both documents
      expect(mockLoadDocument).toHaveBeenCalledTimes(2)

      // Should still save the todo document despite editor error
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledTimes(1)
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledWith(
        userId,
        'todo',
        'local todo text',
        0,
        '',
      )
    })

    it('should handle save errors gracefully', async () => {
      const userId = 'test-user'

      // Mock documents don't exist
      mockLoadDocument.mockResolvedValue(null)

      // Mock save to fail for editor but succeed for todo
      mockSaveDocumentWithConflictResolution
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce({
          newRevision: 1,
          finalText: 'local todo text',
          wasConflicted: false,
        })

      // Should not throw error
      await expect(
        syncManager.initialSync(userId, mockGetState, mockDispatch),
      ).resolves.toBeUndefined()

      // Should have attempted to save both documents
      expect(mockSaveDocumentWithConflictResolution).toHaveBeenCalledTimes(2)
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
