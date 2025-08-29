import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { StructuredTodosManager } from './StructuredTodosManager'
import { setStructuredTodosEnabled } from './structuredTodosSlice'
import { StructuredTodosSettings } from './types'
import {
  mockDb,
  mockDoc,
  mockSetDoc,
  mockGetDoc,
  mockDeleteDoc,
  mockOnSnapshot,
  clearAllFirebaseMocks,
} from '../test/firebase-mocks'

describe('StructuredTodosManager', () => {
  let manager: StructuredTodosManager
  const userId = 'test-user-id'
  const mockDispatch = mock(() => {})

  beforeEach(() => {
    manager = new StructuredTodosManager()
    clearAllFirebaseMocks()
    mockDispatch.mockClear()

    // Default mockGetDoc behavior
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    } as any)
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
      mockGetDoc.mockResolvedValue(mockSettingsSnapshot as any)

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
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as any)

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

      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as any)

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
