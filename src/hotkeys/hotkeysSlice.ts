import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface HotkeysState {
  mappings: Record<string, string>
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
}

const hotkeysSlice = createSlice({
  name: 'hotkeys',
  initialState,
  reducers: {
    setHotkey(state, action: PayloadAction<{ id: string; keys: string }>) {
      state.mappings[action.payload.id] = action.payload.keys
      localStorage.setItem(HOTKEYS_KEY, JSON.stringify(state.mappings))
    },
  },
})

export const hotkeysReducer = hotkeysSlice.reducer
export const { setHotkey } = hotkeysSlice.actions
