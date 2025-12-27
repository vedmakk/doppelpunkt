import React from 'react'

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
