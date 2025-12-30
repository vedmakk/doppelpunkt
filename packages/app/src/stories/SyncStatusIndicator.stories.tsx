import React, { useState, useEffect } from 'react'

import { SyncStatusIndicator } from '../shared/components/SyncStatusIndicator'
import { CloudSyncUiStatus } from '../cloudsync/selectors'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/SyncStatusIndicator',
  decorators: [CommonStoryDecorator],
}

export const Disabled = () => {
  return <SyncStatusIndicator status="disabled" />
}

export const Connected = () => {
  return <SyncStatusIndicator status="connected" />
}

export const Disconnected = () => {
  return <SyncStatusIndicator status="disconnected" />
}

export const Pending = () => {
  return <SyncStatusIndicator status="pending" />
}

export const Error = () => {
  return <SyncStatusIndicator status="error" />
}

export const SmallSize = () => {
  return <SyncStatusIndicator status="connected" size="small" />
}

export const MediumSize = () => {
  return <SyncStatusIndicator status="connected" size="medium" />
}

export const LargeSize = () => {
  return <SyncStatusIndicator status="connected" size="large" />
}

export const AllStatesSmall = () => {
  const statuses: CloudSyncUiStatus[] = [
    'disabled',
    'connected',
    'pending',
    'disconnected',
    'error',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {statuses.map((status) => (
        <SyncStatusIndicator key={status} status={status} size="small" />
      ))}
    </div>
  )
}

export const AllStatesMedium = () => {
  const statuses: CloudSyncUiStatus[] = [
    'disabled',
    'connected',
    'pending',
    'disconnected',
    'error',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {statuses.map((status) => (
        <SyncStatusIndicator key={status} status={status} size="medium" />
      ))}
    </div>
  )
}

export const AllStatesLarge = () => {
  const statuses: CloudSyncUiStatus[] = [
    'disabled',
    'connected',
    'pending',
    'disconnected',
    'error',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {statuses.map((status) => (
        <SyncStatusIndicator key={status} status={status} size="large" />
      ))}
    </div>
  )
}

export const AllStatesOnlyIcon = () => {
  const statuses: CloudSyncUiStatus[] = [
    'disabled',
    'connected',
    'pending',
    'disconnected',
    'error',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {statuses.map((status) => (
        <SyncStatusIndicator
          key={status}
          status={status}
          size="small"
          onlyIcon
        />
      ))}
    </div>
  )
}

export const CyclingStates = () => {
  const statuses: CloudSyncUiStatus[] = [
    'disabled',
    'connected',
    'pending',
    'disconnected',
    'error',
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % statuses.length)
    }, 500)

    return () => clearInterval(interval)
  }, [statuses.length])

  const currentStatus = statuses[currentIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '14px', color: '#666' }}>
        Current status: <strong>{currentStatus}</strong> ({currentIndex + 1}/
        {statuses.length})
      </div>
      <div
        style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            background: 'rgba(255, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <SyncStatusIndicator status={currentStatus} size="large" onlyIcon />
      </div>
      <div style={{ marginTop: '24px' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          All states (for alignment comparison):
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px',
            border: '1px solid #eee',
            borderRadius: '4px',
            background: '#f9f9f9',
          }}
        >
          {statuses.map((status) => (
            <div
              key={status}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <SyncStatusIndicator status={status} size="large" onlyIcon />
              <div
                style={{
                  fontSize: '10px',
                  color: '#999',
                  textTransform: 'capitalize',
                }}
              >
                {status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
