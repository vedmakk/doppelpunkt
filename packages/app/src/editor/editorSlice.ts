import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WritingMode } from '../mode/modeSlice'

import { TUTORIAL_PLACEHOLDER } from './tutorial'

export interface EditorDocument {
  text: string
  cursorPos: number
}

export interface EditorState {
  documents: Record<WritingMode, EditorDocument>
  autoSave: boolean
  captureTab: boolean
}

// Initial state is a safe default. Actual persisted values are hydrated at store creation.
const initialState: EditorState = {
  documents: {
    editor: { text: TUTORIAL_PLACEHOLDER, cursorPos: 0 },
    todo: { text: TUTORIAL_PLACEHOLDER, cursorPos: 0 },
  },
  autoSave: false,
  captureTab: true,
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setText(
      state,
      action: PayloadAction<{
        mode: WritingMode
        text: string
        cursorPos: number
      }>,
    ) {
      const { mode, text, cursorPos } = action.payload
      const current = state.documents[mode]
      if (text === current.text) {
        return
      }
      state.documents[mode] = { text, cursorPos }
    },
    clear(state, action: PayloadAction<{ mode: WritingMode }>) {
      const { mode } = action.payload
      state.documents[mode] = { text: '', cursorPos: 0 }
    },
    load(state, action: PayloadAction<{ mode: WritingMode; text: string }>) {
      const { mode, text } = action.payload
      state.documents[mode] = { text, cursorPos: text.length }
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
