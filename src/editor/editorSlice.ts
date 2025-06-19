import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TUTORIAL_PLACEHOLDER } from './tutorial'

interface EditorState {
  text: string
  cursorPos: number
  autoSave: boolean
  captureTab: boolean
}

const EDITOR_KEY = 'editor'
const MARKDOWN_KEY = `${EDITOR_KEY}.markdown`
const AUTO_SAVE_KEY = `${EDITOR_KEY}.autoSave`

const initialText = localStorage.getItem(MARKDOWN_KEY) || TUTORIAL_PLACEHOLDER

const initialState: EditorState = {
  text: initialText,
  cursorPos: initialText === TUTORIAL_PLACEHOLDER ? 0 : initialText.length,
  autoSave: localStorage.getItem(AUTO_SAVE_KEY) === 'true',
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
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.text)
      }
    },
    clear(state) {
      state.text = ''
      state.cursorPos = 0
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.text)
      }
    },
    load(state, action: PayloadAction<string>) {
      state.text = action.payload
      state.cursorPos = action.payload.length
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.text)
      }
    },
    toggleAutoSave(state, action: PayloadAction<boolean>) {
      const enabled = action.payload
      state.autoSave = enabled
      if (enabled) {
        localStorage.setItem(AUTO_SAVE_KEY, 'true')
        localStorage.setItem(MARKDOWN_KEY, state.text)
      } else {
        localStorage.removeItem(AUTO_SAVE_KEY)
        localStorage.removeItem(MARKDOWN_KEY)
      }
    },
    setCaptureTab(state, action: PayloadAction<boolean>) {
      state.captureTab = action.payload
    },
  },
})

export const editorReducer = editorSlice.reducer
export const { setText, clear, load, toggleAutoSave, setCaptureTab } =
  editorSlice.actions
