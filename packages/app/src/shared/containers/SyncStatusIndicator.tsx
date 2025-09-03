import React from 'react'

import { useCloudSyncStatus } from '../../cloudsync/hooks'
import { SyncStatusIndicator as SyncStatusIndicatorComponent } from '../components/SyncStatusIndicator'

interface Props {
  featureName: 'cloudSync'
  size?: 'small' | 'medium' | 'large'
  onlyIcon?: boolean
}

export const SyncStatusIndicator: React.FC<Props> = ({
  featureName,
  size = 'medium',
  onlyIcon = false,
}) => {
  const status = useCloudSyncStatus()

  if (featureName !== 'cloudSync') {
    // Currently only supports cloudSync, but designed for future extensibility
    return null
  }

  return (
    <SyncStatusIndicatorComponent
      status={status}
      size={size}
      onlyIcon={onlyIcon}
    />
  )
}
