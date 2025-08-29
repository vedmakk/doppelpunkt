import React from 'react'
import styled from '@emotion/styled'
import { CloudSyncUiStatus } from '../../cloudsync/selectors'

interface Props {
  status: CloudSyncUiStatus
  size?: 'small' | 'medium' | 'large'
}

interface IndicatorStyleProps {
  status: CloudSyncUiStatus
  size: NonNullable<Props['size']>
}

const StatusIndicator = styled.span<IndicatorStyleProps>(
  ({ theme, status, size }) => {
    const sizeMap = {
      small: theme.spacing(1),
      medium: theme.spacing(1.5),
      large: theme.spacing(2),
    }

    const colorMap = {
      disabled: theme.colors.secondary,
      initializing: theme.colors.primary,
      error: theme.colors.todoPriorityHigh,
      disconnected: theme.colors.secondary,
      syncing: theme.colors.primary,
      offline: theme.colors.todoPriorityMedium,
      synced: theme.colors.primary,
    }

    return {
      display: 'inline-block',
      width: sizeMap[size],
      height: sizeMap[size],
      borderRadius: '50%',
      backgroundColor: colorMap[status],
      transition: `background-color ${theme.animations.transition}`,
      flexShrink: 0,
    }
  },
)

const Container = styled.span(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}))

const StatusText = styled.span<{ size: NonNullable<Props['size']> }>(
  ({ theme, size }) => {
    const fontSizeMap = {
      small: theme.fontSize.tiny,
      medium: theme.fontSize.small,
      large: theme.fontSize.normal,
    }

    return {
      fontSize: fontSizeMap[size],
      color: theme.colors.secondary,
      fontFamily: 'Fira Code, monospace',
    }
  },
)

const getStatusTooltip = (status: CloudSyncUiStatus): string => {
  switch (status) {
    case 'disabled':
      return 'Cloud sync is disabled'
    case 'initializing':
      return 'Connecting to cloud sync...'
    case 'error':
      return 'Cloud sync error - check your connection'
    case 'disconnected':
      return 'Disconnected from cloud sync'
    case 'syncing':
      return 'Syncing changes to cloud...'
    case 'offline':
      return 'Offline - showing cached data'
    case 'synced':
      return 'Synced with cloud'
    default:
      return 'Unknown sync status'
  }
}

const getStatusText = (status: CloudSyncUiStatus): string => {
  switch (status) {
    case 'disabled':
      return 'Disabled'
    case 'initializing':
      return 'Connecting…'
    case 'error':
      return 'Error'
    case 'disconnected':
      return 'Disconnected'
    case 'syncing':
      return 'Syncing…'
    case 'offline':
      return 'Offline'
    case 'synced':
      return 'Synced'
    default:
      return 'Unknown'
  }
}

export const SyncStatusIndicator: React.FC<Props> = ({
  status,
  size = 'medium',
}) => {
  const tooltip = getStatusTooltip(status)
  const statusText = getStatusText(status)

  return (
    <Container title={tooltip}>
      <StatusIndicator status={status} size={size} />
      <StatusText size={size}>{statusText}</StatusText>
    </Container>
  )
}
