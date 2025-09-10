import { useCustomHotkey } from '../../hotkeys/hooks'
import { getHotkey } from '../../hotkeys/registry'
import { HotkeyId } from '../../hotkeys/registry'
import { useDestructiveAction } from './useDestructiveAction'

export const useDestructiveHotkey = (
  id: HotkeyId,
  onAction: (e?: KeyboardEvent) => void,
  requiresCondition?: () => boolean,
) => {
  const hotkey = getHotkey(id)

  // Only proceed if this hotkey is marked as destructive
  if (!hotkey.destructive) {
    throw new Error(`Hotkey ${id} is not marked as destructive`)
  }

  const { executeAction, confirmationProps } = useDestructiveAction({
    configId: hotkey.destructive,
    onAction: (e) => onAction(e as KeyboardEvent),
    requiresCondition,
  })

  // Use existing hotkey system but with our destructive action handler
  useCustomHotkey(id, executeAction)

  return {
    confirmationProps,
  }
}
