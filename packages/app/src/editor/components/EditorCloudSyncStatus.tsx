import React from 'react'

import { CloudSyncUiStatus } from '../../cloudsync/selectors'
import { SyncStatusIndicator } from '../../shared/components/SyncStatusIndicator'
import { TransientStatusIndicator } from '../../shared/components/TransientStatusIndicator'

interface Props {
  status: CloudSyncUiStatus
  isMenuOpen: boolean
}

/**
 * Determines if the status indicator should stay pinned (always visible)
 * Pin when: syncing (pending), error, or disconnected (connecting)
 */
const shouldPin = (status: CloudSyncUiStatus): boolean => {
  return status === 'pending' || status === 'error' || status === 'disconnected'
}

/**
 * Cloud sync status indicator for the editor status bar.
 * Only visible when the menu is closed.
 * Uses transient display - appears on status change, fades out unless pinned.
 */
export const EditorCloudSyncStatus: React.FC<Props> = ({
  status,
  isMenuOpen,
}) => {
  // Don't show when menu is open (the toolbar already shows sync status)
  // Also don't show when cloud sync is disabled
  if (isMenuOpen || status === 'disabled') {
    return null
  }

  return (
    <TransientStatusIndicator
      statusKey={status}
      pinned={shouldPin(status)}
      displayDuration={2000}
    >
      <SyncStatusIndicator status={status} size="small" onlyIcon />
    </TransientStatusIndicator>
  )
}
