import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type SettingsPage = 'general' | 'hotkeys'

export interface SettingsState {
  readonly isOpen: boolean
  readonly activePage: SettingsPage
  readonly activeSection?: string
}

const initialState: SettingsState = {
  isOpen: false,
  activePage: 'general',
  activeSection: undefined,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    openSettings(
      state,
      action: PayloadAction<
        { page?: SettingsPage; section?: string } | undefined
      >,
    ) {
      const page = action?.payload?.page ?? 'general'
      const section = action?.payload?.section
      return {
        ...state,
        isOpen: true,
        activePage: page,
        activeSection: section,
      }
    },
    closeSettings(state) {
      return {
        ...state,
        isOpen: false,
        activeSection: undefined,
      }
    },
    setActivePage(state, action: PayloadAction<SettingsPage>) {
      return {
        ...state,
        activePage: action.payload,
      }
    },
    clearActiveSection(state) {
      return {
        ...state,
        activeSection: undefined,
      }
    },
  },
})

export const settingsReducer = settingsSlice.reducer
export const {
  openSettings,
  closeSettings,
  setActivePage,
  clearActiveSection,
} = settingsSlice.actions
