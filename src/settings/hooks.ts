import { useAppSelector, RootState } from '../store'
import { SettingsPage } from './settingsSlice'

export const useIsSettingsOpen = () =>
  useAppSelector((state: RootState) => state.settings.isOpen)

export const useActiveSettingsPage = (): SettingsPage =>
  useAppSelector((state: RootState) => state.settings.activePage)
