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

export const Initializing = () => {
  return <SyncStatusIndicator status="initializing" />
}

export const Error = () => {
  return <SyncStatusIndicator status="error" />
}

export const Disconnected = () => {
  return <SyncStatusIndicator status="disconnected" />
}

export const Syncing = () => {
  return <SyncStatusIndicator status="syncing" />
}

export const Offline = () => {
  return <SyncStatusIndicator status="offline" />
}

export const Synced = () => {
  return <SyncStatusIndicator status="synced" />
}

export const SmallSize = () => {
  return <SyncStatusIndicator status="synced" size="small" />
}

export const MediumSize = () => {
  return <SyncStatusIndicator status="synced" size="medium" />
}

export const LargeSize = () => {
  return <SyncStatusIndicator status="synced" size="large" />
}

export const AllStatesSmall = () => {
  const statuses: CloudSyncUiStatus[] = [
    'disabled',
    'initializing',
    'error',
    'disconnected',
    'syncing',
    'offline',
    'synced',
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
    'initializing',
    'error',
    'disconnected',
    'syncing',
    'offline',
    'synced',
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
    'initializing',
    'error',
    'disconnected',
    'syncing',
    'offline',
    'synced',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {statuses.map((status) => (
        <SyncStatusIndicator key={status} status={status} size="large" />
      ))}
    </div>
  )
}
