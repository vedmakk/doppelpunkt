import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type WritingMode = 'editor' | 'todo'

export interface ModeState {
  readonly selected: WritingMode
}

const initialState: ModeState = {
  selected: 'editor',
}

const modeSlice = createSlice({
  name: 'mode',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<WritingMode>) => {
      state.selected = action.payload
    },
  },
})

export const modeReducer = modeSlice.reducer
export const { setMode } = modeSlice.actions
