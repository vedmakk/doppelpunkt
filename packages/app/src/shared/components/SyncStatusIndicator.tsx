import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

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

const StatusIndicator = styled.span<IndicatorStyleProps>`
  ${({ theme, status, size }) => {
    const sizeMap = {
      small: theme.spacing(1),
      medium: theme.spacing(1.5),
      large: theme.spacing(2),
    }

    const colorMap: Record<CloudSyncUiStatus, string> = {
      disabled: theme.colors.secondary,
      disconnected: theme.colors.secondary,
      pending: theme.colors.primary,
      connected: theme.colors.primary,
    }

    return css`
      display: inline-block;
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
      border-radius: 50%;
      background-color: ${colorMap[status]};
      transition: background-color ${theme.animations.transition};
      flex-shrink: 0;
      opacity: ${status === 'pending' ? 0.4 : 1};
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
    case 'disconnected':
      return 'Connecting to cloud...'
    case 'pending':
      return 'Syncing changes...'
    case 'connected':
      return 'Synced with cloud'
    default:
      return 'Unknown sync status'
  }
}

const getStatusText = (status: CloudSyncUiStatus): string => {
  switch (status) {
    case 'disabled':
      return 'Disabled'
    case 'disconnected':
      return 'Connecting'
    case 'pending':
      return 'Syncing'
    case 'connected':
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
