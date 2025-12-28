import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { StructuredTodosManager } from './StructuredTodosManager'
import {
  setStructuredTodosEnabled,
  setApiKeyIsSet,
  setStructuredTodos,
} from './structuredTodosSlice'
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

  describe('saveTodosData', () => {
    it('should save todos data to Firestore', async () => {
      const mockTodosRef = { id: 'todos-ref' }
      mockDoc.mockReturnValue(mockTodosRef)
      mockSetDoc.mockResolvedValue(undefined)

      const data = {
        todos: [{ id: 'todo-1', description: 'Test todo' }],
        contentHash: 'abc123',
      }

      await manager.saveTodosData(userId, data)

      expect(mockDoc).toHaveBeenCalledWith(
        mockDb,
        `users/${userId}/structuredTodos/data`,
      )
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockTodosRef,
        expect.objectContaining({
          todos: data.todos,
          contentHash: data.contentHash,
          updatedAt: expect.any(Number),
        }),
      )
    })
  })

  describe('loadTodosData', () => {
    it('should load todos data from Firestore', async () => {
      const mockTodosRef = { id: 'todos-ref' }
      mockDoc.mockReturnValue(mockTodosRef)

      const mockData = {
        todos: [{ id: 'todo-1', description: 'Test todo' }],
        contentHash: 'abc123',
        updatedAt: Date.now(),
      }
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockData,
      } as any)

      const result = await manager.loadTodosData(userId)

      expect(result).toEqual(mockData)
    })

    it('should return null when no data exists', async () => {
      mockDoc.mockReturnValue({ id: 'todos-ref' })
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as any)

      const result = await manager.loadTodosData(userId)

      expect(result).toBeNull()
    })
  })

  describe('startListening', () => {
    it('should set up listeners for settings and todos', async () => {
      const mockSettingsRef = { id: 'settings-ref' }
      const mockTodosRef = { id: 'todos-ref' }
      const mockSettingsSnapshot = {
        exists: () => true,
        data: () => ({ enabled: true, hasApiKey: true }),
      }

      mockDoc
        .mockReturnValueOnce(mockSettingsRef)
        .mockReturnValueOnce(mockTodosRef)
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
      expect(mockDispatch).toHaveBeenCalledWith(setApiKeyIsSet(true))

      // Verify both listeners are set up (settings + todos)
      expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
    })

    it('should handle settings without initial data', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as any)

      await manager.startListening(userId, mockDispatch)

      // Both listeners should still be set up
      expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
    })

    it('should dispatch apiKeyIsSet false when hasApiKey is false', async () => {
      const mockSettingsSnapshot = {
        exists: () => true,
        data: () => ({ enabled: true, hasApiKey: false }),
      }
      mockGetDoc.mockResolvedValue(mockSettingsSnapshot as any)

      await manager.startListening(userId, mockDispatch)

      expect(mockDispatch).toHaveBeenCalledWith(setApiKeyIsSet(false))
    })

    it('should dispatch apiKeyIsSet false when hasApiKey is not set', async () => {
      const mockSettingsSnapshot = {
        exists: () => true,
        data: () => ({ enabled: true }), // No hasApiKey field
      }
      mockGetDoc.mockResolvedValue(mockSettingsSnapshot as any)

      await manager.startListening(userId, mockDispatch)

      expect(mockDispatch).toHaveBeenCalledWith(setApiKeyIsSet(false))
    })

    it('should dispatch setStructuredTodos when receiving todos from cloud', async () => {
      const mockSettingsRef = { id: 'settings-ref' }
      const mockTodosRef = { id: 'todos-ref' }
      let todosSnapshotCallback: any

      mockDoc
        .mockReturnValueOnce(mockSettingsRef)
        .mockReturnValueOnce(mockTodosRef)

      const mockSettingsUnsubscribe = mock(() => {})
      const mockTodosUnsubscribe = mock(() => {})
      mockOnSnapshot
        .mockImplementationOnce(() => mockSettingsUnsubscribe)
        .mockImplementationOnce((ref: any, callback: any) => {
          todosSnapshotCallback = callback
          return mockTodosUnsubscribe
        })

      await manager.startListening(userId, mockDispatch)

      // Simulate receiving todos from cloud
      const cloudTodos = {
        todos: [{ id: 'todo-1', description: 'Cloud todo' }],
        contentHash: 'cloud-hash-123',
      }

      todosSnapshotCallback({
        exists: () => true,
        data: () => cloudTodos,
      })

      // Should dispatch setStructuredTodos with cloud data
      const dispatchCalls = mockDispatch.mock.calls as any[][]
      const setTodosCall = dispatchCalls.find(
        (call) => call[0]?.type === setStructuredTodos.type,
      )

      expect(setTodosCall).toBeDefined()
      expect(setTodosCall![0].payload).toEqual({
        todos: cloudTodos.todos,
        contentHash: cloudTodos.contentHash,
      })
      // Should have fromCloud metadata
      expect(setTodosCall![0].meta?.fromCloud).toBe(true)
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
    it('should delete both settings and todos documents', async () => {
      const mockSettingsRef = { id: 'settings-ref' }
      const mockTodosRef = { id: 'todos-ref' }
      mockDoc
        .mockReturnValueOnce(mockSettingsRef)
        .mockReturnValueOnce(mockTodosRef)
      mockDeleteDoc.mockResolvedValue(undefined)

      await manager.deleteUserData(userId)

      expect(mockDoc).toHaveBeenCalledWith(
        mockDb,
        `users/${userId}/settings/structuredTodos`,
      )
      expect(mockDoc).toHaveBeenCalledWith(
        mockDb,
        `users/${userId}/structuredTodos/data`,
      )
      expect(mockDeleteDoc).toHaveBeenCalledTimes(2)
    })

    it('should handle deletion errors gracefully', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Document not found'))

      // Should not throw
      await expect(manager.deleteUserData(userId)).resolves.toBeUndefined()
    })
  })
})
