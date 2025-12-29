import React from 'react'
import styled from '@emotion/styled'
import { css, keyframes } from '@emotion/react'

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

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`

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
      error: theme.colors.error,
    }

    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
      border-radius: 50%;
      background-color: ${colorMap[status]};
      transition: background-color ${theme.animations.transition};
      flex-shrink: 0;
      ${status === 'pending' &&
      css`
        animation: ${pulse} 1.5s ease-in-out infinite;
      `}
    `
  }}
`

// SVG icon for checkmark (tick)
const TickIcon = styled.svg<{ size: NonNullable<Props['size']> }>`
  ${({ theme, size }) => {
    const iconSizeMap = {
      small: '6px',
      medium: '9px',
      large: '12px',
    }

    return css`
      width: ${iconSizeMap[size]};
      height: ${iconSizeMap[size]};
      stroke: ${theme.colors.page};
      stroke-width: 2.5;
      fill: none;
    `
  }}
`

// SVG icon for cross (x)
const CrossIcon = styled.svg<{ size: NonNullable<Props['size']> }>`
  ${({ theme, size }) => {
    const iconSizeMap = {
      small: '5px',
      medium: '7px',
      large: '10px',
    }

    return css`
      width: ${iconSizeMap[size]};
      height: ${iconSizeMap[size]};
      stroke: ${theme.colors.page};
      stroke-width: 2.5;
      fill: none;
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
    case 'error':
      return 'Cloud sync error'
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
    case 'error':
      return 'Error'
    default:
      return 'Unknown'
  }
}

const StatusIcon: React.FC<{
  status: CloudSyncUiStatus
  size: NonNullable<Props['size']>
}> = ({ status, size }) => {
  if (status === 'connected') {
    return (
      <TickIcon size={size} viewBox="0 0 12 12" aria-hidden="true">
        <polyline points="2,6 5,9 10,3" />
      </TickIcon>
    )
  }

  if (status === 'error') {
    return (
      <CrossIcon size={size} viewBox="0 0 12 12" aria-hidden="true">
        <line x1="2" y1="2" x2="10" y2="10" />
        <line x1="10" y1="2" x2="2" y2="10" />
      </CrossIcon>
    )
  }

  return null
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
      <StatusIndicator status={status} size={size}>
        <StatusIcon status={status} size={size} />
      </StatusIndicator>
      {!onlyIcon && <StatusText size={size}>{statusText}</StatusText>}
    </Container>
  )
}
