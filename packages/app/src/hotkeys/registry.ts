export enum HotkeyId {
  ToggleCaptureTab = 'toggleCaptureTab',
  ToggleMenu = 'toggleMenu',
  NewDocument = 'newDocument',
  OpenDocument = 'openDocument',
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
      'Toggle capturing the Tab key in the editor (insert tab vs. focus change).',
    defaultKeys: 'ctrl+shift+l',
    scope: HotkeyScope.Editor,
  },
  {
    id: HotkeyId.NewDocument,
    label: 'New Document',
    description: 'Create a new document.',
    defaultKeys: 'ctrl+shift+n',
    scope: HotkeyScope.Editor,
  },
  {
    id: HotkeyId.OpenDocument,
    label: 'Open Document',
    description: 'Open a document from the file system.',
    defaultKeys: 'ctrl+shift+o',
    scope: HotkeyScope.Editor,
  },
  {
    id: HotkeyId.ToggleMenu,
    label: 'Menu',
    description: 'Toggle the editor menu.',
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
