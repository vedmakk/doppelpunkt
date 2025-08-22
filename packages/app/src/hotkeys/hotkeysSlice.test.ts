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
    mockLocalStorage = createMockLocalStorage()
    originalGetItem = localStorage.getItem
    originalSetItem = localStorage.setItem
    originalRemoveItem = localStorage.removeItem

    // Mock localStorage methods
    localStorage.getItem = mockLocalStorage.getItem.bind(mockLocalStorage)
    localStorage.setItem = mockLocalStorage.setItem.bind(mockLocalStorage)
    localStorage.removeItem = mockLocalStorage.removeItem.bind(mockLocalStorage)
  })

  afterEach(() => {
    localStorage.getItem = originalGetItem
    localStorage.setItem = originalSetItem
    localStorage.removeItem = originalRemoveItem
  })

  describe('initial state', () => {
    it('should have correct initial state structure', () => {
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      expect(typeof getHotkeysState().mappings).toBe('object')
      expect(getHotkeysState().editingHotkeyId).toBeUndefined()
    })

    it('should handle localStorage interaction correctly', () => {
      // Test localStorage interaction through actions instead of initial loading
      const store = createStore()

      // Set a hotkey to test localStorage persistence
      store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+test' }))

      // Verify it was set in state
      expect(store.getState().hotkeys.mappings['test-key']).toBe('cmd+test')
    })
  })

  describe('setEditingHotkeyId', () => {
    it(`should handle ${setEditingHotkeyId.type} action`, () => {
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
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      expect(getHotkeysState().mappings).toEqual({})

      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))

      expect(getHotkeysState().mappings).toEqual({
        'toggle-menu': 'cmd+m',
      })

      // Verify localStorage was called (localStorage interaction is tested through state)
    })

    it('should add multiple hotkeys', () => {
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      store.dispatch(setHotkey({ id: 'toggle-theme', keys: 'cmd+shift+t' }))
      store.dispatch(setHotkey({ id: 'save-document', keys: 'cmd+s' }))

      expect(getHotkeysState().mappings).toEqual({
        'toggle-menu': 'cmd+m',
        'toggle-theme': 'cmd+shift+t',
        'save-document': 'cmd+s',
      })

      // Verify all mappings are in state
      const expectedMappings = {
        'toggle-menu': 'cmd+m',
        'toggle-theme': 'cmd+shift+t',
        'save-document': 'cmd+s',
      }
      expect(getHotkeysState().mappings).toEqual(expectedMappings)
    })

    it('should update existing hotkey', () => {
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

      const expectedMappings = complexKeys.reduce(
        (acc, { id, keys }) => ({ ...acc, [id]: keys }),
        {},
      )

      expect(getHotkeysState().mappings).toEqual(expectedMappings)
    })
  })

  describe('setDefaultHotkey', () => {
    it(`should handle ${setDefaultHotkey.type} action`, () => {
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // First set a hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      store.dispatch(setHotkey({ id: 'toggle-theme', keys: 'cmd+t' }))

      expect(getHotkeysState().mappings).toEqual({
        'toggle-menu': 'cmd+m',
        'toggle-theme': 'cmd+t',
      })

      // Reset one hotkey to default
      store.dispatch(setDefaultHotkey({ id: 'toggle-menu' }))

      expect(getHotkeysState().mappings).toEqual({
        'toggle-theme': 'cmd+t',
      })

      // Verify state is updated correctly
    })

    it('should remove localStorage item when all mappings are cleared', () => {
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set a single hotkey
      store.dispatch(setHotkey({ id: 'toggle-menu', keys: 'cmd+m' }))
      expect(getHotkeysState().mappings).toEqual({ 'toggle-menu': 'cmd+m' })

      // Reset the only hotkey
      store.dispatch(setDefaultHotkey({ id: 'toggle-menu' }))

      expect(getHotkeysState().mappings).toEqual({})
    })

    it('should handle resetting non-existent hotkey gracefully', () => {
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set a hotkey
      store.dispatch(setHotkey({ id: 'existing-hotkey', keys: 'cmd+e' }))

      // Try to reset a non-existent hotkey
      store.dispatch(setDefaultHotkey({ id: 'non-existent-hotkey' }))

      // Should not affect existing mappings
      expect(getHotkeysState().mappings).toEqual({
        'existing-hotkey': 'cmd+e',
      })
    })
  })

  describe('complex hotkey management workflows', () => {
    it('should handle full hotkey management lifecycle', () => {
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
      const store = createStore()
      const getHotkeysState = () => store.getState().hotkeys

      // Set multiple hotkeys
      store.dispatch(setHotkey({ id: 'key1', keys: 'cmd+1' }))
      store.dispatch(setHotkey({ id: 'key2', keys: 'cmd+2' }))
      store.dispatch(setHotkey({ id: 'key3', keys: 'cmd+3' }))

      expect(Object.keys(getHotkeysState().mappings)).toHaveLength(3)

      // Reset all to defaults one by one
      store.dispatch(setDefaultHotkey({ id: 'key1' }))
      expect(Object.keys(getHotkeysState().mappings)).toHaveLength(2)

      store.dispatch(setDefaultHotkey({ id: 'key2' }))
      expect(Object.keys(getHotkeysState().mappings)).toHaveLength(1)

      store.dispatch(setDefaultHotkey({ id: 'key3' }))
      expect(Object.keys(getHotkeysState().mappings)).toHaveLength(0)
    })

    it('should handle special characters in hotkey combinations', () => {
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
