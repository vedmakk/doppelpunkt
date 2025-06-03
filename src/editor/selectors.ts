import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'

export const selectEditor = (s: RootState) => s.editor

export const selectEditorText = createSelector(
  selectEditor,
  (editor) => editor.present,
)
