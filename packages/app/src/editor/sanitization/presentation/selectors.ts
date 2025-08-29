import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../../store'
import { presentationPipeline } from './pipeline'
import { PresentationContext } from '../types'
import { selectEditorCursorPos, selectEditorText } from '../../selectors'
import { selectWritingMode } from '../../../mode/selectors'

export const selectDisplayText = createSelector(
  [
    selectEditorText,
    selectEditorCursorPos,
    selectWritingMode,
    (_state: RootState, maxCharsPerLine?: number) => maxCharsPerLine,
  ],
  (text, { cursorPos }, mode, maxCharsPerLine) => {
    const context: PresentationContext = {
      text,
      cursorPos,
      mode,
      maxCharsPerLine,
    }

    return presentationPipeline.transform(text, context)
  },
)
