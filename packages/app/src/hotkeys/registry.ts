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

import { DestructiveActionId } from '../destructive-actions/types'

export interface HotkeyDefinition {
  id: HotkeyId
  label: string
  description: string
  defaultKeys: string
  scope: HotkeyScope
  destructive?: DestructiveActionId | false // New field: either false or destructive action ID
}

export const hotkeys: HotkeyDefinition[] = [
  {
    id: HotkeyId.ToggleCaptureTab,
    label: 'Tab Capture',
    description:
      'Toggle capturing the Tab key in the editor (insert tab vs. focus change).',
    defaultKeys: 'ctrl+shift+l',
    scope: HotkeyScope.Editor,
    destructive: false,
  },
  {
    id: HotkeyId.NewDocument,
    label: 'New Document',
    description: 'Create a new document.',
    defaultKeys: 'ctrl+shift+n',
    scope: HotkeyScope.Editor,
    destructive: DestructiveActionId.NewDocument,
  },
  {
    id: HotkeyId.OpenDocument,
    label: 'Open Document',
    description: 'Open a document from the file system.',
    defaultKeys: 'ctrl+shift+o',
    scope: HotkeyScope.Editor,
    destructive: DestructiveActionId.OpenDocument,
  },
  {
    id: HotkeyId.ToggleMenu,
    label: 'Menu',
    description: 'Toggle the editor menu.',
    defaultKeys: 'escape',
    scope: HotkeyScope.Global,
    destructive: false,
  },
]

export const getHotkey = (id: HotkeyId): HotkeyDefinition => {
  const hotkey = hotkeys.find((hk) => hk.id === id)
  if (!hotkey) {
    throw new Error(`Hotkey ${id} not found`)
  }
  return hotkey
}
