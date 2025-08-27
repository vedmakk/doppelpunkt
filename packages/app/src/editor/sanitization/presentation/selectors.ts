import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../../store'
import { presentationPipeline } from './pipeline'
import { PresentationContext } from '../types'

export const selectDisplayText = createSelector(
  [
    (state: RootState) => state.editor.documents[state.mode.selected].text,
    (state: RootState) => state.editor.documents[state.mode.selected].cursorPos,
    (state: RootState) => state.mode.selected,
    (_state: RootState, maxCharsPerLine?: number) => maxCharsPerLine,
  ],
  (text, cursorPos, mode, maxCharsPerLine) => {
    const context: PresentationContext = {
      text,
      cursorPos,
      mode,
      maxCharsPerLine,
    }

    return presentationPipeline.transform(text, context)
  },
)
