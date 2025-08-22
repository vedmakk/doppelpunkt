import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { HotkeyId } from './registry'

export interface HotkeysState {
  mappings: Record<string, string>
  editingHotkeyId?: HotkeyId
}

const HOTKEYS_KEY = 'hotkeys.mappings'

const loadMappings = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(HOTKEYS_KEY) || '{}')
  } catch {
    return {}
  }
}

const initialState: HotkeysState = {
  mappings: loadMappings(),
  editingHotkeyId: undefined,
}

const hotkeysSlice = createSlice({
  name: 'hotkeys',
  initialState,
  reducers: {
    setEditingHotkeyId(state, action: PayloadAction<HotkeyId | undefined>) {
      state.editingHotkeyId = action.payload
    },
    setHotkey(state, action: PayloadAction<{ id: string; keys: string }>) {
      state.mappings[action.payload.id] = action.payload.keys
      localStorage.setItem(HOTKEYS_KEY, JSON.stringify(state.mappings))
    },
    setDefaultHotkey(state, action: PayloadAction<{ id: string }>) {
      delete state.mappings[action.payload.id]

      if (Object.keys(state.mappings).length === 0) {
        localStorage.removeItem(HOTKEYS_KEY)
      } else {
        localStorage.setItem(HOTKEYS_KEY, JSON.stringify(state.mappings))
      }
    },
  },
})

export const hotkeysReducer = hotkeysSlice.reducer
export const { setHotkey, setEditingHotkeyId, setDefaultHotkey } =
  hotkeysSlice.actions
