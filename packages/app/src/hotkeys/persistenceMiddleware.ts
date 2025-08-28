import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setHotkey, setDefaultHotkey } from './hotkeysSlice'
import { safeLocalStorage } from '../shared/storage'

const HOTKEYS_KEY = 'hotkeys.mappings'

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
