import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface EditorState {
  past: string[]
  present: string
  future: string[]
}

const initialContent = localStorage.getItem('markdown') || ''

const initialState: EditorState = {
  past: [],
  present: initialContent,
  future: [],
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
      localStorage.setItem('markdown', state.present)
    },
    clear(state) {
      state.past = []
      state.future = []
      state.present = ''
      localStorage.setItem('markdown', state.present)
    },
    load(state, action: PayloadAction<string>) {
      state.past = []
      state.future = []
      state.present = action.payload
      localStorage.setItem('markdown', state.present)
    },
    undo(state) {
      if (state.past.length > 0) {
        const previous = state.past.pop()!
        state.future.unshift(state.present)
        state.present = previous
        localStorage.setItem('markdown', state.present)
      }
    },
    redo(state) {
      if (state.future.length > 0) {
        const next = state.future.shift()!
        state.past.push(state.present)
        state.present = next
        localStorage.setItem('markdown', state.present)
      }
    },
  },
})

export const { setText, clear, load, undo, redo } = editorSlice.actions
export default editorSlice.reducer
