import { RootState } from '../store'
import { HotkeyId } from './registry'

export const selectHotkeys = (s: RootState) => s.hotkeys.mappings
export const selectHotkey = (id: string) => (state: RootState) =>
  state.hotkeys.mappings[id]
export const selectEditingHotkeyId = (state: RootState): HotkeyId | undefined =>
  state.hotkeys.editingHotkeyId
