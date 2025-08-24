import { describe, it, expect } from 'bun:test'
import {
  openSettings,
  closeSettings,
  setShouldRender,
  setActivePage,
  clearActiveSection,
} from './settingsSlice'
import { createStore } from '../store'

describe('settingsSlice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createStore()
      const settingsState = store.getState().settings

      expect(settingsState.isOpen).toBe(false)
      expect(settingsState.shouldRender).toBe(false)
      expect(settingsState.activePage).toBe('general')
      expect(settingsState.activeSection).toBeUndefined()
    })
  })

  describe('openSettings', () => {
    it(`should handle ${openSettings.type} action with no parameters`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(openSettings())

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('general') // Default page
      expect(state.activeSection).toBeUndefined()
    })

    it(`should handle ${openSettings.type} action with page parameter`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(openSettings({ page: 'hotkeys' }))

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('hotkeys')
      expect(state.activeSection).toBeUndefined()
    })

    it(`should handle ${openSettings.type} action with section parameter`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(openSettings({ section: 'appearance' }))

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('general') // Default when only section provided
      expect(state.activeSection).toBe('appearance')
    })

    it(`should handle ${openSettings.type} action with both page and section`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(
        openSettings({ page: 'hotkeys', section: 'editor-shortcuts' }),
      )

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('hotkeys')
      expect(state.activeSection).toBe('editor-shortcuts')
    })

    it(`should handle ${openSettings.type} action when already open`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Open with general page
      store.dispatch(openSettings({ page: 'general' }))
      expect(getSettingsState().activePage).toBe('general')

      // Open with hotkeys page - should update
      store.dispatch(openSettings({ page: 'hotkeys', section: 'shortcuts' }))

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('hotkeys')
      expect(state.activeSection).toBe('shortcuts')
    })

    it('should handle undefined payload gracefully', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(openSettings(undefined))

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('general')
      expect(state.activeSection).toBeUndefined()
    })
  })

  describe('closeSettings', () => {
    it(`should handle ${closeSettings.type} action`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // First open settings
      store.dispatch(
        openSettings({ page: 'hotkeys', section: 'editor-shortcuts' }),
      )

      const openState = getSettingsState()
      expect(openState.isOpen).toBe(true)
      expect(openState.shouldRender).toBe(true)
      expect(openState.activePage).toBe('hotkeys')
      expect(openState.activeSection).toBe('editor-shortcuts')

      // Close settings
      store.dispatch(closeSettings())

      const closedState = getSettingsState()
      expect(closedState.isOpen).toBe(false)
      expect(closedState.shouldRender).toBe(true) // Should remain true for animations
      expect(closedState.activePage).toBe('hotkeys') // Should preserve page
      expect(closedState.activeSection).toBeUndefined() // Should clear section
    })

    it('should handle closing when already closed', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Initial state is closed
      expect(getSettingsState().isOpen).toBe(false)

      // Close again
      store.dispatch(closeSettings())

      const state = getSettingsState()
      expect(state.isOpen).toBe(false)
      expect(state.shouldRender).toBe(false)
      expect(state.activePage).toBe('general')
      expect(state.activeSection).toBeUndefined()
    })
  })

  describe('setShouldRender', () => {
    it(`should handle ${setShouldRender.type} action`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      expect(getSettingsState().shouldRender).toBe(false)

      store.dispatch(setShouldRender(true))
      expect(getSettingsState().shouldRender).toBe(true)

      store.dispatch(setShouldRender(false))
      expect(getSettingsState().shouldRender).toBe(false)
    })

    it('should preserve other state when changing shouldRender', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Set up some state
      store.dispatch(openSettings({ page: 'hotkeys', section: 'test' }))

      const beforeState = getSettingsState()
      expect(beforeState.isOpen).toBe(true)
      expect(beforeState.activePage).toBe('hotkeys')
      expect(beforeState.activeSection).toBe('test')

      // Change shouldRender
      store.dispatch(setShouldRender(false))

      const afterState = getSettingsState()
      expect(afterState.shouldRender).toBe(false)
      expect(afterState.isOpen).toBe(true) // Should preserve
      expect(afterState.activePage).toBe('hotkeys') // Should preserve
      expect(afterState.activeSection).toBe('test') // Should preserve
    })
  })

  describe('setActivePage', () => {
    it(`should handle ${setActivePage.type} action with general page`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(setActivePage('general'))
      expect(getSettingsState().activePage).toBe('general')
    })

    it(`should handle ${setActivePage.type} action with hotkeys page`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      store.dispatch(setActivePage('hotkeys'))
      expect(getSettingsState().activePage).toBe('hotkeys')
    })

    it('should preserve other state when changing active page', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Set up some state
      store.dispatch(openSettings({ section: 'test-section' }))

      const beforeState = getSettingsState()
      expect(beforeState.isOpen).toBe(true)
      expect(beforeState.shouldRender).toBe(true)
      expect(beforeState.activeSection).toBe('test-section')

      // Change active page
      store.dispatch(setActivePage('hotkeys'))

      const afterState = getSettingsState()
      expect(afterState.activePage).toBe('hotkeys')
      expect(afterState.isOpen).toBe(true) // Should preserve
      expect(afterState.shouldRender).toBe(true) // Should preserve
      expect(afterState.activeSection).toBe('test-section') // Should preserve
    })
  })

  describe('clearActiveSection', () => {
    it(`should handle ${clearActiveSection.type} action`, () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Set up state with active section
      store.dispatch(openSettings({ page: 'hotkeys', section: 'test-section' }))

      expect(getSettingsState().activeSection).toBe('test-section')

      // Clear active section
      store.dispatch(clearActiveSection())

      const state = getSettingsState()
      expect(state.activeSection).toBeUndefined()
      expect(state.isOpen).toBe(true) // Should preserve other state
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('hotkeys')
    })

    it('should handle clearing when no active section', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Initial state has no active section
      expect(getSettingsState().activeSection).toBeUndefined()

      // Clear active section
      store.dispatch(clearActiveSection())

      expect(getSettingsState().activeSection).toBeUndefined()
    })

    it('should preserve other state when clearing active section', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Set up state
      store.dispatch(openSettings({ page: 'hotkeys', section: 'test' }))
      store.dispatch(setShouldRender(true))

      const beforeState = getSettingsState()
      expect(beforeState.isOpen).toBe(true)
      expect(beforeState.shouldRender).toBe(true)
      expect(beforeState.activePage).toBe('hotkeys')
      expect(beforeState.activeSection).toBe('test')

      // Clear section
      store.dispatch(clearActiveSection())

      const afterState = getSettingsState()
      expect(afterState.activeSection).toBeUndefined()
      expect(afterState.isOpen).toBe(true) // Should preserve
      expect(afterState.shouldRender).toBe(true) // Should preserve
      expect(afterState.activePage).toBe('hotkeys') // Should preserve
    })
  })

  describe('complex settings workflows', () => {
    it('should handle full settings modal lifecycle', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Initial closed state
      expect(getSettingsState().isOpen).toBe(false)
      expect(getSettingsState().shouldRender).toBe(false)

      // Open settings to general page
      store.dispatch(openSettings({ page: 'general' }))

      let state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.shouldRender).toBe(true)
      expect(state.activePage).toBe('general')

      // Navigate to hotkeys page
      store.dispatch(setActivePage('hotkeys'))

      state = getSettingsState()
      expect(state.activePage).toBe('hotkeys')
      expect(state.isOpen).toBe(true)

      // Navigate to a specific section
      store.dispatch(openSettings({ page: 'hotkeys', section: 'shortcuts' }))

      state = getSettingsState()
      expect(state.activePage).toBe('hotkeys')
      expect(state.activeSection).toBe('shortcuts')

      // Clear section
      store.dispatch(clearActiveSection())
      expect(getSettingsState().activeSection).toBeUndefined()

      // Close settings
      store.dispatch(closeSettings())

      state = getSettingsState()
      expect(state.isOpen).toBe(false)
      expect(state.shouldRender).toBe(true) // Remains true for animations
      expect(state.activeSection).toBeUndefined()

      // Hide for cleanup (e.g., after animation)
      store.dispatch(setShouldRender(false))
      expect(getSettingsState().shouldRender).toBe(false)
    })

    it('should handle rapid state changes', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Rapid open/close
      store.dispatch(openSettings())
      store.dispatch(closeSettings())
      store.dispatch(openSettings({ page: 'hotkeys' }))

      const state = getSettingsState()
      expect(state.isOpen).toBe(true)
      expect(state.activePage).toBe('hotkeys')

      // Rapid page switching
      store.dispatch(setActivePage('general'))
      store.dispatch(setActivePage('hotkeys'))
      store.dispatch(setActivePage('general'))

      expect(getSettingsState().activePage).toBe('general')

      // Rapid section operations
      store.dispatch(openSettings({ section: 'section1' }))
      store.dispatch(openSettings({ section: 'section2' }))
      store.dispatch(clearActiveSection())

      expect(getSettingsState().activeSection).toBeUndefined()
    })

    it('should handle edge case combinations', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      // Open with section but no page (should default to general)
      store.dispatch(openSettings({ section: 'test-section' }))

      let state = getSettingsState()
      expect(state.activePage).toBe('general')
      expect(state.activeSection).toBe('test-section')

      // Change page while keeping section
      store.dispatch(setActivePage('hotkeys'))

      state = getSettingsState()
      expect(state.activePage).toBe('hotkeys')
      expect(state.activeSection).toBe('test-section') // Should preserve

      // Open with different page and section
      store.dispatch(
        openSettings({ page: 'general', section: 'different-section' }),
      )

      state = getSettingsState()
      expect(state.activePage).toBe('general')
      expect(state.activeSection).toBe('different-section')
    })

    it('should maintain state immutability', () => {
      const store = createStore()

      const initialState = store.getState().settings

      store.dispatch(openSettings({ page: 'hotkeys', section: 'test' }))

      const newState = store.getState().settings

      // States should be different objects
      expect(initialState).not.toBe(newState)
      expect(initialState.isOpen).toBe(false)
      expect(newState.isOpen).toBe(true)
    })

    it('should not affect other state slices', () => {
      const store = createStore()

      const initialEditor = store.getState().editor
      const initialTheme = store.getState().theme
      const initialMode = store.getState().mode

      // Perform settings operations
      store.dispatch(openSettings({ page: 'hotkeys', section: 'test' }))
      store.dispatch(setActivePage('general'))
      store.dispatch(closeSettings())

      // Other slices should remain unchanged
      expect(store.getState().editor).toBe(initialEditor)
      expect(store.getState().theme).toBe(initialTheme)
      expect(store.getState().mode).toBe(initialMode)
    })
  })

  describe('type validation and edge cases', () => {
    it('should handle all valid SettingsPage values', () => {
      const store = createStore()
      const getSettingsState = () => store.getState().settings

      const validPages: Array<'general' | 'hotkeys'> = ['general', 'hotkeys']

      validPages.forEach((page) => {
        store.dispatch(setActivePage(page))
        expect(getSettingsState().activePage).toBe(page)
      })
    })

    it('should maintain correct state shape', () => {
      const store = createStore()

      store.dispatch(openSettings({ page: 'hotkeys', section: 'test' }))

      const state = store.getState().settings

      expect(typeof state.isOpen).toBe('boolean')
      expect(typeof state.shouldRender).toBe('boolean')
      expect(typeof state.activePage).toBe('string')
      expect(['general', 'hotkeys']).toContain(state.activePage)

      // activeSection can be string or undefined
      if (state.activeSection !== undefined) {
        expect(typeof state.activeSection).toBe('string')
      }
    })
  })
})
