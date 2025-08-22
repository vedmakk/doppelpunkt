import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../store'

export const selectMode = (s: RootState) => s.mode

export const selectWritingMode = createSelector(
  selectMode,
  (mode) => mode.selected,
)
