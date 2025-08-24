import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../store'

export const selectSettingsState = (s: RootState) => s.settings

export const selectIsSettingsOpen = createSelector(
  selectSettingsState,
  (s) => s.isOpen,
)

export const selectShouldRenderSettings = createSelector(
  selectSettingsState,
  (s) => s.shouldRender,
)

export const selectSettingsActivePage = createSelector(
  selectSettingsState,
  (s) => s.activePage,
)
