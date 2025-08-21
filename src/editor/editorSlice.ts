import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TUTORIAL_PLACEHOLDER } from './tutorial'

export interface EditorState {
  text: string
  cursorPos: number
  autoSave: boolean
  captureTab: boolean
}

// Initial state is a safe default. Actual persisted values are hydrated at store creation.
const initialState: EditorState = {
  text: TUTORIAL_PLACEHOLDER,
  cursorPos: 0,
  autoSave: false,
  captureTab: true,
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setText(state, action: PayloadAction<{ text: string; cursorPos: number }>) {
      const { text, cursorPos } = action.payload
      if (text === state.text) {
        return
      }
      state.text = text
      state.cursorPos = cursorPos
    },
    clear(state) {
      state.text = ''
      state.cursorPos = 0
    },
    load(state, action: PayloadAction<string>) {
      state.text = action.payload
      state.cursorPos = action.payload.length
    },
    toggleAutoSave(state, action: PayloadAction<boolean>) {
      const enabled = action.payload
      state.autoSave = enabled
    },
    setCaptureTab(state, action: PayloadAction<boolean>) {
      state.captureTab = action.payload
    },
  },
})

export const editorReducer = editorSlice.reducer
export const { setText, clear, load, toggleAutoSave, setCaptureTab } =
  editorSlice.actions
