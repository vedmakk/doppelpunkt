// Types
export type { DestructiveActionConfig } from './types'
export { DestructiveActionId } from './types'

// Configuration
export {
  DESTRUCTIVE_ACTION_CONFIGS,
  getDestructiveActionConfig,
} from './config'

// Hooks
export { useDestructiveAction } from './hooks/useDestructiveAction'
export { useDestructiveHotkey } from './hooks/useDestructiveHotkey'

// Components
export { DestructiveButton } from './components/DestructiveButton'
export { ConfirmationModal } from './components/ConfirmationModal'
