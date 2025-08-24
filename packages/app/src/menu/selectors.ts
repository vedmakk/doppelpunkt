import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'

export const selectMenuState = (s: RootState) => s.menu

export const selectIsMenuOpen = createSelector(selectMenuState, (s) => s.isOpen)

export const selectShouldRenderMenu = createSelector(
  selectMenuState,
  (s) => s.shouldRender,
)
