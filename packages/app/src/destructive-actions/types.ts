export enum DestructiveActionId {
  NewDocument = 'newDocument',
  OpenDocument = 'openDocument',
  DeleteAccount = 'deleteAccount',
  ClearApiKey = 'clearApiKey',
}

export interface DestructiveActionConfig {
  id: DestructiveActionId
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  requiresCondition?: () => boolean
}
