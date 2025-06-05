import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TUTORIAL_PLACEHOLDER } from './tutorial'

interface EditorState {
  past: string[]
  present: string
  future: string[]
  autoSave: boolean
}

const EDITOR_KEY = 'editor'
const MARKDOWN_KEY = `${EDITOR_KEY}.markdown`
const AUTO_SAVE_KEY = `${EDITOR_KEY}.autoSave`

const initialState: EditorState = {
  past: [],
  present: localStorage.getItem(MARKDOWN_KEY) || TUTORIAL_PLACEHOLDER,
  future: [],
  autoSave: localStorage.getItem(AUTO_SAVE_KEY) === 'true',
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setText(state, action: PayloadAction<string>) {
      const newText = action.payload
      if (newText === state.present) {
        return
      }
      state.past.push(state.present)
      state.present = newText
      state.future = []
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.present)
      }
    },
    clear(state) {
      state.past = []
      state.future = []
      state.present = ''
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.present)
      }
    },
    load(state, action: PayloadAction<string>) {
      state.past = []
      state.future = []
      state.present = action.payload
      if (state.autoSave) {
        localStorage.setItem(MARKDOWN_KEY, state.present)
      }
    },
    undo(state) {
      if (state.past.length > 0) {
        const previous = state.past.pop()!
        state.future.unshift(state.present)
        state.present = previous
        if (state.autoSave) {
          localStorage.setItem(MARKDOWN_KEY, state.present)
        }
      }
    },
    redo(state) {
      if (state.future.length > 0) {
        const next = state.future.shift()!
        state.past.push(state.present)
        state.present = next
        if (state.autoSave) {
          localStorage.setItem(MARKDOWN_KEY, state.present)
        }
      }
    },
    toggleAutoSave(state, action: PayloadAction<boolean>) {
      const enabled = action.payload
      state.autoSave = enabled
      if (enabled) {
        localStorage.setItem(AUTO_SAVE_KEY, 'true')
        localStorage.setItem(MARKDOWN_KEY, state.present)
      } else {
        localStorage.removeItem(AUTO_SAVE_KEY)
        localStorage.removeItem(MARKDOWN_KEY)
      }
    },
  },
})

export const editorReducer = editorSlice.reducer
export const { setText, clear, load, undo, redo, toggleAutoSave } =
  editorSlice.actions
