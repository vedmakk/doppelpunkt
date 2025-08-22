import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'
import { selectWritingMode } from '../mode/selectors'

export const selectEditor = (s: RootState) => s.editor

export const selectCurrentDocument = createSelector(
  selectEditor,
  selectWritingMode,
  (editor, mode) => editor.documents[mode],
)

export const selectEditorText = createSelector(
  selectCurrentDocument,
  (doc) => doc.text,
)

export const selectEditorCursorPos = createSelector(
  selectCurrentDocument,
  (doc) => ({
    text: doc.text,
    cursorPos: doc.cursorPos,
  }),
)

export const selectAutoSaveEnabled = createSelector(
  selectEditor,
  (editor) => editor.autoSave,
)

export const selectCaptureTab = createSelector(
  selectEditor,
  (editor) => editor.captureTab,
)
