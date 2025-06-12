export enum HotkeyId {
  ToggleCaptureTab = 'toggleCaptureTab',
  ToggleMenu = 'toggleMenu',
}

export enum HotkeyScope {
  Global = 'global',
  Editor = 'editor',
}

export interface HotkeyDefinition {
  id: HotkeyId
  description: string
  defaultKeys: string
  scope: HotkeyScope
}

export const hotkeys: HotkeyDefinition[] = [
  {
    id: HotkeyId.ToggleCaptureTab,
    description: 'Toggle capture tab key in editor',
    defaultKeys: 'ctrl+shift+l',
    scope: HotkeyScope.Editor,
  },
  {
    id: HotkeyId.ToggleMenu,
    description: 'Toggle menu',
    defaultKeys: 'escape',
    scope: HotkeyScope.Global,
  },
]

export const getHotkey = (id: HotkeyId): HotkeyDefinition => {
  const hotkey = hotkeys.find((hk) => hk.id === id)
  if (!hotkey) {
    throw new Error(`Hotkey ${id} not found`)
  }
  return hotkey
}
