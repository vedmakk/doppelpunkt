import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setHotkey, setDefaultHotkey, HotkeysState } from './hotkeysSlice'
import { safeLocalStorage } from '../shared/storage'

const HOTKEYS_KEY = 'hotkeys.mappings'

export function hydrateHotkeysStateFromStorage(): {
  hotkeys: HotkeysState
} {
  try {
    const mappings = JSON.parse(safeLocalStorage.getItem(HOTKEYS_KEY) || '{}')
    const hotkeys: HotkeysState = {
      mappings,
      editingHotkeyId: undefined,
    }
    return { hotkeys }
  } catch {
    // In non-browser or restricted environments, fall back to defaults
    const hotkeys: HotkeysState = {
      mappings: {},
      editingHotkeyId: undefined,
    }
    return { hotkeys }
  }
}

export const hotkeysListenerMiddleware = createListenerMiddleware()

hotkeysListenerMiddleware.startListening({
  matcher: isAnyOf(setHotkey, setDefaultHotkey),
  effect: async (_action, api) => {
    const mappings = (api.getState() as any).hotkeys.mappings
    if (!mappings || Object.keys(mappings).length === 0) {
      safeLocalStorage.removeItem(HOTKEYS_KEY)
    } else {
      safeLocalStorage.setItem(HOTKEYS_KEY, JSON.stringify(mappings))
    }
  },
})
