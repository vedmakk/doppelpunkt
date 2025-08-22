import { describe, it, expect } from 'bun:test'
import { setMode } from './modeSlice'
import { createStore } from '../store'

describe('modeSlice', () => {
  describe('setMode', () => {
    it(`should handle ${setMode.type} action with editor mode`, () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      // Initial state should be editor
      expect(getModeState().selected).toBe('editor')

      // Setting to editor again should work
      store.dispatch(setMode('editor'))
      expect(getModeState().selected).toBe('editor')
    })

    it(`should handle ${setMode.type} action with todo mode`, () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      expect(getModeState().selected).toBe('editor')

      store.dispatch(setMode('todo'))
      expect(getModeState().selected).toBe('todo')
    })

    it('should handle mode switching back and forth', () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      // Start with editor
      expect(getModeState().selected).toBe('editor')

      // Switch to todo
      store.dispatch(setMode('todo'))
      expect(getModeState().selected).toBe('todo')

      // Switch back to editor
      store.dispatch(setMode('editor'))
      expect(getModeState().selected).toBe('editor')

      // Switch to todo again
      store.dispatch(setMode('todo'))
      expect(getModeState().selected).toBe('todo')
    })

    it('should handle rapid mode switching', () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      // Rapid consecutive switches
      store.dispatch(setMode('todo'))
      store.dispatch(setMode('editor'))
      store.dispatch(setMode('todo'))
      store.dispatch(setMode('editor'))
      store.dispatch(setMode('todo'))

      expect(getModeState().selected).toBe('todo')
    })

    it('should maintain state immutability', () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      const initialState = getModeState()

      store.dispatch(setMode('todo'))

      const newState = getModeState()

      // States should be different objects (immutable)
      expect(initialState).not.toBe(newState)
      expect(initialState.selected).toBe('editor')
      expect(newState.selected).toBe('todo')
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createStore()
      const modeState = store.getState().mode

      expect(modeState.selected).toBe('editor')
      expect(Object.keys(modeState)).toContain('selected')
      expect(Object.keys(modeState)).toHaveLength(1)
    })

    it('should have readonly selected property in type system', () => {
      const store = createStore()
      const modeState = store.getState().mode

      // This test is more about TypeScript types, but we can verify the property exists
      expect(modeState).toHaveProperty('selected')
      expect(typeof modeState.selected).toBe('string')
    })
  })

  describe('integration with other state', () => {
    it('should not affect other state slices when mode changes', () => {
      const store = createStore()

      // Get initial state of other slices
      const initialEditorState = store.getState().editor
      const initialThemeState = store.getState().theme
      const initialMenuState = store.getState().menu

      // Change mode
      store.dispatch(setMode('todo'))

      // Other slices should remain unchanged
      expect(store.getState().editor).toBe(initialEditorState)
      expect(store.getState().theme).toBe(initialThemeState)
      expect(store.getState().menu).toBe(initialMenuState)

      // Only mode should change
      expect(store.getState().mode.selected).toBe('todo')
    })

    it('should work correctly with multiple store instances', () => {
      const store1 = createStore()
      const store2 = createStore()

      // Change mode in first store
      store1.dispatch(setMode('todo'))

      // Stores should be independent
      expect(store1.getState().mode.selected).toBe('todo')
      expect(store2.getState().mode.selected).toBe('editor')

      // Change mode in second store
      store2.dispatch(setMode('todo'))

      // Both should now be todo
      expect(store1.getState().mode.selected).toBe('todo')
      expect(store2.getState().mode.selected).toBe('todo')
    })
  })

  describe('edge cases and type safety', () => {
    it('should handle valid WritingMode values', () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      // Test both valid values
      const validModes: Array<'editor' | 'todo'> = ['editor', 'todo']

      validModes.forEach((mode) => {
        store.dispatch(setMode(mode))
        expect(getModeState().selected).toBe(mode)
      })
    })

    it('should maintain consistency across multiple mode changes', () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      // Perform many mode changes and verify consistency
      const modes: Array<'editor' | 'todo'> = [
        'todo',
        'editor',
        'todo',
        'todo',
        'editor',
        'editor',
        'todo',
        'editor',
        'todo',
        'editor',
      ]

      modes.forEach((mode) => {
        store.dispatch(setMode(mode))
        expect(getModeState().selected).toBe(mode)
      })

      // Final state should be the last mode set
      expect(getModeState().selected).toBe('editor')
    })

    it('should work with destructured state access', () => {
      const store = createStore()

      store.dispatch(setMode('todo'))

      const { mode } = store.getState()
      const { selected } = mode

      expect(selected).toBe('todo')
    })

    it('should handle rapid succession of same mode', () => {
      const store = createStore()
      const getModeState = () => store.getState().mode

      // Set same mode multiple times
      store.dispatch(setMode('todo'))
      store.dispatch(setMode('todo'))
      store.dispatch(setMode('todo'))

      expect(getModeState().selected).toBe('todo')

      // Switch and repeat
      store.dispatch(setMode('editor'))
      store.dispatch(setMode('editor'))
      store.dispatch(setMode('editor'))

      expect(getModeState().selected).toBe('editor')
    })
  })

  describe('state shape validation', () => {
    it('should maintain correct state shape after operations', () => {
      const store = createStore()

      // Perform various operations
      store.dispatch(setMode('todo'))
      store.dispatch(setMode('editor'))

      const modeState = store.getState().mode

      // Verify state shape
      expect(typeof modeState).toBe('object')
      expect(modeState).not.toBeNull()
      expect(Object.keys(modeState)).toEqual(['selected'])
      expect(typeof modeState.selected).toBe('string')
      expect(['editor', 'todo']).toContain(modeState.selected)
    })

    it('should not introduce unexpected properties', () => {
      const store = createStore()

      store.dispatch(setMode('todo'))

      const modeState = store.getState().mode

      // Should only have the expected property
      expect(Object.keys(modeState)).toHaveLength(1)
      expect(modeState).toHaveProperty('selected')
      expect(modeState).not.toHaveProperty('mode')
      expect(modeState).not.toHaveProperty('current')
      expect(modeState).not.toHaveProperty('active')
    })
  })
})
