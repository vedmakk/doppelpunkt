import React from 'react'
import styled from '@emotion/styled'
import { keyframes, css } from '@emotion/react'

import { CloudSyncUiStatus } from '../../cloudsync/selectors'

interface Props {
  status: CloudSyncUiStatus
  size?: 'small' | 'medium' | 'large'
  onlyIcon?: boolean
}

interface IndicatorStyleProps {
  status: CloudSyncUiStatus
  size: NonNullable<Props['size']>
}

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.2; }
`

const pulseAnimationCss = css`
  animation: ${pulseAnimation} 1s infinite;
`

const StatusIndicator = styled.span<IndicatorStyleProps>`
  ${({ theme, status, size }) => {
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
      pending: theme.colors.primary,
      syncing: theme.colors.primary,
      offline: theme.colors.todoPriorityMedium,
      synced: theme.colors.primary,
    }

    return css`
      display: inline-block;
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
      border-radius: 50%;
      background-color: ${colorMap[status]};
      transition: background-color ${theme.animations.transition};
      flex-shrink: 0;
      opacity: ${status === 'pending' ? 0.2 : 1};
      ${status === 'syncing' || status === 'initializing'
        ? pulseAnimationCss
        : ''}
    `
  }}
`

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
    case 'pending':
      return 'Has pending local changes...'
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
    case 'pending':
      return 'Pending'
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
  onlyIcon = false,
}) => {
  const tooltip = getStatusTooltip(status)
  const statusText = getStatusText(status)

  return (
    <Container title={tooltip}>
      <StatusIndicator status={status} size={size} />
      {!onlyIcon && <StatusText size={size}>{statusText}</StatusText>}
    </Container>
  )
}
