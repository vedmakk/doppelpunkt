import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'

export const selectEditor = (s: RootState) => s.editor

export const selectEditorText = createSelector(
  selectEditor,
  (editor) => editor.text,
)

export const selectEditorCursorPos = createSelector(selectEditor, (editor) => ({
  text: editor.text,
  cursorPos: editor.cursorPos,
}))

export const selectAutoSaveEnabled = createSelector(
  selectEditor,
  (editor) => editor.autoSave,
)

export const selectCaptureTab = createSelector(
  selectEditor,
  (editor) => editor.captureTab,
)
