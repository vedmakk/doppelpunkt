import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../../store'
import { presentationPipeline } from './pipeline'
import { PresentationContext } from '../types'
import { selectEditorCursorPos, selectEditorText } from '../../selectors'

export const selectDisplayText = createSelector(
  [
    selectEditorText,
    selectEditorCursorPos,
    (_state: RootState, maxCharsPerLine?: number) => maxCharsPerLine,
  ],
  (text, { cursorPos }, maxCharsPerLine) => {
    const context: PresentationContext = {
      text,
      cursorPos,
      maxCharsPerLine,
    }

    return presentationPipeline.transform(text, context)
  },
)
