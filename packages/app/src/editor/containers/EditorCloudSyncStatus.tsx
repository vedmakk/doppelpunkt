import React from 'react'

import { useCloudSyncStatus } from '../../cloudsync/hooks'
import { useIsMenuOpen } from '../../menu/hooks'
import { EditorCloudSyncStatus as EditorCloudSyncStatusComponent } from '../components/EditorCloudSyncStatus'

/**
 * Container for EditorCloudSyncStatus that connects to Redux state.
 */
export const EditorCloudSyncStatus: React.FC = () => {
  const status = useCloudSyncStatus()
  const isMenuOpen = useIsMenuOpen()

  return (
    <EditorCloudSyncStatusComponent status={status} isMenuOpen={isMenuOpen} />
  )
}
