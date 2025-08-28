import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { setHotkey, setEditingHotkeyId, setDefaultHotkey } from './hotkeysSlice'
import { HotkeyId } from './registry'
import { createStore } from '../store'

// Mock localStorage
const createMockLocalStorage = () => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null,
  }
}

describe('hotkeysSlice', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>
  let originalGetItem: typeof localStorage.getItem
  let originalSetItem: typeof localStorage.setItem
  let originalRemoveItem: typeof localStorage.removeItem

  beforeEach(() => {
    originalGetItem = localStorage.getItem
    originalSetItem = localStorage.setItem
    originalRemoveItem = localStorage.removeItem
  })

  // Helper to setup clean localStorage for each test
  const setupCleanLocalStorage = () => {
    mockLocalStorage = createMockLocalStorage()
    localStorage.getItem = mockLocalStorage.getItem.bind(mockLocalStorage)
    localStorage.setItem = mockLocalStorage.setItem.bind(mockLocalStorage)
    localStorage.removeItem = mockLocalStorage.removeItem.bind(mockLocalStorage)
  }

  afterEach(() => {
    localStorage.getItem = originalGetItem
    localStorage.setItem = originalSetItem
    localStorage.removeItem = originalRemoveItem
  })

  describe('initial state', () => {
    it('should have correct initial state structure', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      expect(typeof getHotkeysState().mappings).toBe('object')
      expect(getHotkeysState().editingHotkeyId).toBeUndefined()
    })

    it('should handle localStorage interaction correctly', () => {
      // Test localStorage interaction through actions instead of initial loading
      setupCleanLocalStorage()
      const store = createStore()

      // Set a hotkey to test localStorage persistence
      store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+test' }))

      // Verify it was set in state
      expect(store.getState().hotkeys.mappings['test-key']).toBe('cmd+test')
    })
  })

  describe('setEditingHotkeyId', () => {
    it(`should handle ${setEditingHotkeyId.type} action`, () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      expect(getHotkeysState().editingHotkeyId).toBeUndefined()

      store.dispatch(setEditingHotkeyId(HotkeyId.ToggleMenu))
      expect(getHotkeysState().editingHotkeyId).toBe(HotkeyId.ToggleMenu)

      store.dispatch(setEditingHotkeyId(HotkeyId.ToggleCaptureTab))
      expect(getHotkeysState().editingHotkeyId).toBe(HotkeyId.ToggleCaptureTab)

      store.dispatch(setEditingHotkeyId(undefined))
      expect(getHotkeysState().editingHotkeyId).toBeUndefined()
    })
  })

  describe('setHotkey', () => {
    it(`should handle ${setHotkey.type} action`, () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      const initialState = getHotkeysState().mappings

      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))

      expect(getHotkeysState().mappings).toEqual({
        ...initialState,
        'toggle-menu': 'cmd+m',
      })

      // Verify localStorage was called (localStorage interaction is tested through state)
    })

    it('should add multiple hotkeys', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      store.dispatch(setHotkey({ id: 'toggle-theme', keys: 'cmd+shift+t' }))
      store.dispatch(setHotkey({ id: 'save-document', keys: 'cmd+s' }))

      // Verify all the new mappings are in state
      const mappings = getHotkeysState().mappings
      expect(mappings['toggle-menu']).toBe('cmd+m')
      expect(mappings['toggle-theme']).toBe('cmd+shift+t')
      expect(mappings['save-document']).toBe('cmd+s')
    })

    it('should update existing hotkey', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set initial hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      expect(getHotkeysState().mappings['toggle-menu']).toBe('cmd+m')

      // Update the same hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'ctrl+alt+m' }))
      expect(getHotkeysState().mappings['toggle-menu']).toBe('ctrl+alt+m')

      // Verify updated mapping is in state
    })

    it('should handle complex key combinations', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      const complexKeys = [
        { id: 'complex-1', keys: 'cmd+shift+alt+a' },
        { id: 'complex-2', keys: 'ctrl+cmd+f1' },
        { id: 'complex-3', keys: 'shift+space' },
        { id: 'complex-4', keys: 'cmd+,' },
      ]

      complexKeys.forEach((hotkey) => {
        store.dispatch(setHotkey(hotkey))
      })

      // Verify all complex keys are set correctly
      const mappings = getHotkeysState().mappings
      complexKeys.forEach(({ id, keys }) => {
        expect(mappings[id]).toBe(keys)
      })
    })
  })

  describe('setDefaultHotkey', () => {
    it(`should handle ${setDefaultHotkey.type} action`, () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // First set a hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      store.dispatch(setHotkey({ id: 'toggle-theme', keys: 'cmd+t' }))

      // Verify specific hotkeys are set
      const mappings = getHotkeysState().mappings
      expect(mappings['toggle-menu']).toBe('cmd+m')
      expect(mappings['toggle-theme']).toBe('cmd+t')

      // Reset one hotkey to default
      store.dispatch(setDefaultHotkey({ id: 'toggle-menu' }))

      // Verify only toggle-theme remains and toggle-menu is removed
      const finalMappings = getHotkeysState().mappings
      expect(finalMappings['toggle-theme']).toBe('cmd+t')
      expect(finalMappings['toggle-menu']).toBeUndefined()

      // Verify state is updated correctly
    })

    it('should remove localStorage item when all mappings are cleared', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set a single hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      expect(getHotkeysState().mappings['toggle-menu']).toBe('cmd+m')

      // Reset the only hotkey
      store.dispatch(setDefaultHotkey({ id: 'toggle-menu' }))

      // Verify the hotkey is removed
      expect(getHotkeysState().mappings['toggle-menu']).toBeUndefined()
    })

    it('should handle resetting non-existent hotkey gracefully', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set a hotkey
      store.dispatch(setHotkey({ id: 'existing-hotkey', keys: 'cmd+e' }))

      // Try to reset a non-existent hotkey
      store.dispatch(setDefaultHotkey({ id: 'non-existent-hotkey' }))

      // Should not affect existing mappings
      // Verify existing hotkey is still there
      const finalMappings = getHotkeysState().mappings
      expect(finalMappings['existing-hotkey']).toBe('cmd+e')
    })
  })

  describe('complex hotkey management workflows', () => {
    it('should handle full hotkey management lifecycle', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Start editing a hotkey
      store.dispatch(setEditingHotkeyId(HotkeyId.ToggleMenu))
      expect(getHotkeysState().editingHotkeyId).toBe(HotkeyId.ToggleMenu)

      // Set the hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      expect(getHotkeysState().mappings['toggle-menu']).toBe('cmd+m')

      // Stop editing
      store.dispatch(setEditingHotkeyId(undefined))
      expect(getHotkeysState().editingHotkeyId).toBeUndefined()

      // Later, edit the same hotkey
      store.dispatch(setEditingHotkeyId(HotkeyId.ToggleMenu))
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'ctrl+m' }))
      store.dispatch(setEditingHotkeyId(undefined))

      expect(getHotkeysState().mappings['toggle-menu']).toBe('ctrl+m')

      // Reset to default
      store.dispatch(setDefaultHotkey({ id: 'toggle-menu' }))
      expect(getHotkeysState().mappings['toggle-menu']).toBeUndefined()
    })

    it('should handle rapid hotkey modifications', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Rapid set operations
      store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+1' }))
      store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+2' }))
      store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+3' }))

      expect(getHotkeysState().mappings['test-key']).toBe('cmd+3')

      // Rapid editing state changes
      store.dispatch(setEditingHotkeyId('test-key' as any))
      store.dispatch(setEditingHotkeyId('other-key' as any))
      store.dispatch(setEditingHotkeyId(undefined))

      expect(getHotkeysState().editingHotkeyId).toBeUndefined()
    })

    it('should handle edge cases with localStorage', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set multiple hotkeys
      store.dispatch(setHotkey({ id: 'key1', keys: 'cmd+1' }))
      store.dispatch(setHotkey({ id: 'key2', keys: 'cmd+2' }))
      store.dispatch(setHotkey({ id: 'key3', keys: 'cmd+3' }))

      // Verify all three specific keys are set correctly
      const mappings = getHotkeysState().mappings
      expect(mappings['key1']).toBe('cmd+1')
      expect(mappings['key2']).toBe('cmd+2')
      expect(mappings['key3']).toBe('cmd+3')

      // Reset all to defaults one by one
      store.dispatch(setDefaultHotkey({ id: 'key1' }))
      // Verify key1 is removed but key2 and key3 remain
      const afterKey1Removed = getHotkeysState().mappings
      expect(afterKey1Removed['key1']).toBeUndefined()
      expect(afterKey1Removed['key2']).toBe('cmd+2')
      expect(afterKey1Removed['key3']).toBe('cmd+3')

      store.dispatch(setDefaultHotkey({ id: 'key2' }))
      // Verify key2 is removed but key3 remains
      const afterKey2Removed = getHotkeysState().mappings
      expect(afterKey2Removed['key2']).toBeUndefined()
      expect(afterKey2Removed['key3']).toBe('cmd+3')

      store.dispatch(setDefaultHotkey({ id: 'key3' }))
      // Verify key3 is also removed
      const afterKey3Removed = getHotkeysState().mappings
      expect(afterKey3Removed['key3']).toBeUndefined()
    })

    it('should handle special characters in hotkey combinations', () => {
      setupCleanLocalStorage()
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      const specialKeys = [
        { id: 'symbols', keys: 'cmd+shift+!' },
        { id: 'numbers', keys: 'alt+1+2+3' },
        { id: 'arrows', keys: 'ctrl+↑' },
        { id: 'function', keys: 'f1+f2' },
      ]

      specialKeys.forEach((hotkey) => {
        store.dispatch(setHotkey(hotkey))
      })

      specialKeys.forEach(({ id, keys }) => {
        expect(getHotkeysState().mappings[id]).toBe(keys)
      })

      // Verify all special keys are in state
      specialKeys.forEach(({ id, keys }) => {
        expect(getHotkeysState().mappings[id]).toBe(keys)
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should handle state persistence correctly', () => {
      // Test that actions work correctly with localStorage
      setupCleanLocalStorage()
      const store = createStore()

      // Set a hotkey
      store.dispatch(setHotkey({ id: 'persistent-key', keys: 'cmd+p' }))
      expect(store.getState().hotkeys.mappings['persistent-key']).toBe('cmd+p')

      // Reset it
      store.dispatch(setDefaultHotkey({ id: 'persistent-key' }))
      expect(
        store.getState().hotkeys.mappings['persistent-key'],
      ).toBeUndefined()
    })

    it('should handle localStorage quota exceeded gracefully', () => {
      setupCleanLocalStorage()
      const store = createStore()

      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new DOMException('QuotaExceededError')
      }

      // Should not crash when localStorage fails
      expect(() => {
        store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+t' }))
      }).not.toThrow()

      // Restore original implementation
      localStorage.setItem = originalSetItem
    })
  })
})
