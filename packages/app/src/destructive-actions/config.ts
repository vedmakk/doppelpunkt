import { DestructiveActionId, DestructiveActionConfig } from './types'

export const DESTRUCTIVE_ACTION_CONFIGS: Record<
  DestructiveActionId,
  DestructiveActionConfig
> = {
  [DestructiveActionId.NewDocument]: {
    id: DestructiveActionId.NewDocument,
    title: 'Create New Document',
    message:
      'Discard current content and create a new document? Any unsaved changes will be lost.',
    confirmLabel: 'Create New',
    cancelLabel: 'Cancel',
  },
  [DestructiveActionId.OpenDocument]: {
    id: DestructiveActionId.OpenDocument,
    title: 'Open Document',
    message:
      'Discard current content and open a new file? Any unsaved changes will be lost.',
    confirmLabel: 'Open File',
    cancelLabel: 'Cancel',
  },
  [DestructiveActionId.DeleteAccount]: {
    id: DestructiveActionId.DeleteAccount,
    title: 'Delete Account',
    message:
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data from our servers, including all your documents and settings.',
    confirmLabel: 'Delete Account',
    cancelLabel: 'Cancel',
  },
  [DestructiveActionId.ClearApiKey]: {
    id: DestructiveActionId.ClearApiKey,
    title: 'Clear API Key',
    message:
      'Are you sure you want to clear your OpenAI API key? You will need to enter it again to use structured todos.',
    confirmLabel: 'Clear Key',
    cancelLabel: 'Cancel',
  },
}

export const getDestructiveActionConfig = (
  id: DestructiveActionId,
): DestructiveActionConfig => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[id]
  if (!config) {
    throw new Error(`Destructive action config ${id} not found`)
  }
  return config
}
