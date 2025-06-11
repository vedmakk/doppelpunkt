import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TUTORIAL_PLACEHOLDER } from './tutorial'

interface EditorState {
  text: string
  autoSave: boolean
}

const EDITOR_KEY = 'editor'
const MARKDOWN_KEY = `${EDITOR_KEY}.markdown`
const AUTO_SAVE_KEY = `${EDITOR_KEY}.autoSave`

const initialState: EditorState = {
  text: localStorage.getItem(MARKDOWN_KEY) || TUTORIAL_PLACEHOLDER,
  autoSave: localStorage.getItem(AUTO_SAVE_KEY) === 'true',
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setText(state, action: PayloadAction<string>) {
      const newText = action.payload
      if (newText === state.text) {
        return
      }
      state.text = newText
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.text)
      }
    },
    clear(state) {
      state.text = ''
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.text)
      }
    },
    load(state, action: PayloadAction<string>) {
      state.text = action.payload
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
  },
})

export const editorReducer = editorSlice.reducer
export const { setText, clear, load, toggleAutoSave } = editorSlice.actions
