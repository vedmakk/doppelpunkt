import React from 'react'
import { useAppSelector } from '../../store'
import { selectCloudSyncStatus } from '../../cloudsync/selectors'
import { SyncStatusIndicator as SyncStatusIndicatorComponent } from '../components/SyncStatusIndicator'

interface Props {
  featureName: 'cloudSync'
  size?: 'small' | 'medium' | 'large'
}

export const SyncStatusIndicator: React.FC<Props> = ({
  featureName,
  size = 'medium',
}) => {
  const status = useAppSelector(selectCloudSyncStatus)

  if (featureName !== 'cloudSync') {
    // Currently only supports cloudSync, but designed for future extensibility
    return null
  }

  return <SyncStatusIndicatorComponent status={status} size={size} />
}
