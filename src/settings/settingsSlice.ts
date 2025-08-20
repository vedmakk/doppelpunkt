import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type SettingsPage = 'general' | 'hotkeys'

export interface SettingsState {
  readonly isOpen: boolean
  readonly shouldRender: boolean
  readonly activePage: SettingsPage
  readonly activeSection?: string
}

const initialState: SettingsState = {
  isOpen: false,
  shouldRender: false,
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
        shouldRender: true,
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
    setShouldRender(state, action: PayloadAction<boolean>) {
      return {
        ...state,
        shouldRender: action.payload,
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
  setShouldRender,
  setActivePage,
  clearActiveSection,
} = settingsSlice.actions
