import { RootState } from '../store'

export const selectHotkeys = (s: RootState) => s.hotkeys.mappings
export const selectHotkey = (id: string) => (state: RootState) =>
  state.hotkeys.mappings[id]
