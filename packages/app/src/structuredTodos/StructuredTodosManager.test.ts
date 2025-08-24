import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { StructuredTodosManager } from './StructuredTodosManager'
import { setStructuredTodosEnabled } from './structuredTodosSlice'
import { StructuredTodosSettings } from './types'

// Mock Firestore functions
const mockDoc = mock(() => ({ id: 'mock-doc-ref' }))
const mockSetDoc = mock(() => Promise.resolve())
const mockGetDoc = mock()
const mockDeleteDoc = mock(() => Promise.resolve())
const mockOnSnapshot = mock(() => mock(() => {})) // Returns unsubscribe function

const mockDb = {
  id: 'mock-firestore',
}

const mockGetFirebase = mock(() =>
  Promise.resolve({
    db: mockDb,
  }),
)

// Mock modules
mock.module('../cloudsync/firebase', () => ({
  getFirebase: mockGetFirebase,
}))

mock.module('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
}))

describe('StructuredTodosManager', () => {
  let manager: StructuredTodosManager
  const userId = 'test-user-id'
  const mockDispatch = mock(() => {})

  beforeEach(() => {
    manager = new StructuredTodosManager()
    mockDoc.mockClear()
    mockSetDoc.mockClear()
    mockGetDoc.mockClear()
    mockDeleteDoc.mockClear()
    mockOnSnapshot.mockClear()
    mockDispatch.mockClear()
    mockGetFirebase.mockClear()

    // Default mockGetDoc behavior
    mockGetDoc.mockResolvedValue({ exists: () => false })
  })

  afterEach(() => {
    manager.stopListening()
  })

  describe('saveSettings', () => {
    it('should save settings to Firestore', async () => {
      const settings: StructuredTodosSettings = {
        enabled: true,
        apiKey: 'test-api-key',
      }

      const mockSettingsRef = { id: 'settings-ref' }
      mockDoc.mockReturnValue(mockSettingsRef)
      mockSetDoc.mockResolvedValue(undefined)

      await manager.saveSettings(userId, settings)

      expect(mockDoc).toHaveBeenCalledWith(
        mockDb,
        `users/${userId}/settings/structuredTodos`,
      )
      expect(mockSetDoc).toHaveBeenCalledWith(mockSettingsRef, settings, {
        merge: true,
      })
    })

    it('should handle save errors gracefully', async () => {
      const settings: StructuredTodosSettings = {
        enabled: true,
      }

      mockSetDoc.mockRejectedValue(new Error('Firestore error'))

      await expect(manager.saveSettings(userId, settings)).rejects.toThrow(
        'Firestore error',
      )
    })
  })

  describe('startListening', () => {
    it('should set up listeners for settings and todos', async () => {
      const mockSettingsRef = { id: 'settings-ref' }
      const mockTodoDocRef = { id: 'todo-doc-ref' }
      const mockSettingsSnapshot = {
        exists: () => true,
        data: () => ({ enabled: true, apiKey: 'test-key' }),
      }

      mockDoc
        .mockReturnValueOnce(mockSettingsRef)
        .mockReturnValueOnce(mockTodoDocRef)
      mockGetDoc.mockResolvedValue(mockSettingsSnapshot)

      const mockSettingsUnsubscribe = mock(() => {})
      const mockTodosUnsubscribe = mock(() => {})
      mockOnSnapshot
        .mockReturnValueOnce(mockSettingsUnsubscribe)
        .mockReturnValueOnce(mockTodosUnsubscribe)

      await manager.startListening(userId, mockDispatch)

      // Verify initial settings fetch
      expect(mockGetDoc).toHaveBeenCalledWith(mockSettingsRef)
      expect(mockDispatch).toHaveBeenCalledWith(setStructuredTodosEnabled(true))

      // Verify listeners setup
      expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
    })

    it('should handle settings without initial data', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false })

      await manager.startListening(userId, mockDispatch)

      expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
    })
  })

  describe('stopListening', () => {
    it('should unsubscribe from all listeners', async () => {
      const mockUnsubscribe1 = mock(() => {})
      const mockUnsubscribe2 = mock(() => {})

      mockOnSnapshot
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)

      mockGetDoc.mockResolvedValue({ exists: () => false })

      await manager.startListening(userId, mockDispatch)
      manager.stopListening()

      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(mockUnsubscribe2).toHaveBeenCalled()
    })

    it('should handle multiple calls gracefully', () => {
      expect(() => {
        manager.stopListening()
        manager.stopListening()
      }).not.toThrow()
    })
  })

  describe('deleteUserData', () => {
    it('should delete settings document', async () => {
      const mockSettingsRef = { id: 'settings-ref' }
      mockDoc.mockReturnValue(mockSettingsRef)
      mockDeleteDoc.mockResolvedValue(undefined)

      await manager.deleteUserData(userId)

      expect(mockDoc).toHaveBeenCalledWith(
        mockDb,
        `users/${userId}/settings/structuredTodos`,
      )
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockSettingsRef)
    })

    it('should handle deletion errors gracefully', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Document not found'))

      // Should not throw
      await expect(manager.deleteUserData(userId)).resolves.toBeUndefined()
    })
  })
})
