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
  label: string
  description: string
  defaultKeys: string
  scope: HotkeyScope
}

export const hotkeys: HotkeyDefinition[] = [
  {
    id: HotkeyId.ToggleCaptureTab,
    label: 'Tab Capture',
    description:
      'Toggles capturing the Tab key in the editor (insert tab vs. focus change).',
    defaultKeys: 'ctrl+shift+l',
    scope: HotkeyScope.Editor,
  },
  {
    id: HotkeyId.ToggleMenu,
    label: 'Menu',
    description: 'Toggles the editor menu.',
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
