import { useAppSelector } from '../store'

import { SettingsPage } from './settingsSlice'

import {
  selectIsSettingsOpen,
  selectShouldRenderSettings,
  selectSettingsActivePage,
} from './selectors'

export const useIsSettingsOpen = () => useAppSelector(selectIsSettingsOpen)

export const useActiveSettingsPage = (): SettingsPage =>
  useAppSelector(selectSettingsActivePage)

export const useShouldRenderSettings = () =>
  useAppSelector(selectShouldRenderSettings)
