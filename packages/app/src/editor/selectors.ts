import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'
import { selectWritingMode } from '../mode/selectors'
import { TUTORIAL_PLACEHOLDER, tutorialEditor, tutorialTodo } from './tutorial'

export const selectEditor = (s: RootState) => s.editor

export const selectCurrentDocument = createSelector(
  selectEditor,
  selectWritingMode,
  (editor, mode) => editor.documents[mode],
)

export const selectRawEditorText = createSelector(
  selectCurrentDocument,
  (doc) => doc.text,
)

export const selectEditorText = createSelector(
  selectCurrentDocument,
  selectWritingMode,
  (doc, mode) => {
    if (doc.text === TUTORIAL_PLACEHOLDER) {
      return mode === 'editor' ? tutorialEditor : tutorialTodo
    }

    return doc.text
  },
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
