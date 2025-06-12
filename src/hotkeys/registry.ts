export interface HotkeyDefinition {
  id: string
  description: string
  defaultKeys: string
  scope: string
}

export const hotkeys: HotkeyDefinition[] = [
  {
    id: 'toggleCaptureTab',
    description: 'Toggle capture tab key in editor',
    defaultKeys: 'ctrl+shift+m',
    scope: 'editor',
  },
  {
    id: 'toggleMenu',
    description: 'Toggle menu',
    defaultKeys: 'escape',
    scope: 'global',
  },
]

export const getHotkey = (id: string): HotkeyDefinition | undefined =>
  hotkeys.find((hk) => hk.id === id)
