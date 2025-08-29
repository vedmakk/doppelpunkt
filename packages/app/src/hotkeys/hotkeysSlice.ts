import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { HotkeyId } from './registry'

export interface HotkeysState {
  mappings: Record<string, string>
  editingHotkeyId?: HotkeyId
}

const initialState: HotkeysState = {
  mappings: {},
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
    },
    setDefaultHotkey(state, action: PayloadAction<{ id: string }>) {
      delete state.mappings[action.payload.id]
    },
  },
})

export const hotkeysReducer = hotkeysSlice.reducer
export const { setHotkey, setEditingHotkeyId, setDefaultHotkey } =
  hotkeysSlice.actions
