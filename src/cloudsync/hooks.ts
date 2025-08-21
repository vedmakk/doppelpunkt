import { useAppSelector } from '../store'

export const useCloudEnabled = () => useAppSelector((s) => s.cloud.enabled)

export const useCloudStatus = () => useAppSelector((s) => s.cloud.status)

export const useCloudUser = () => useAppSelector((s) => s.cloud.user)

export const useCloudError = () => useAppSelector((s) => s.cloud.error)

export const useCloudDocMetas = () => useAppSelector((s) => s.cloud.docs)

export const useCloudSyncStatusText = (): string =>
  useAppSelector((s) => {
    const enabled = s.cloud.enabled
    const status = s.cloud.status

    if (!enabled) return 'Disabled'
    if (status === 'initializing') return 'Connecting…'
    if (status === 'error') return 'Error'
    if (status !== 'connected') return 'Disconnected'

    const docs = s.cloud.docs
    const anyPending =
      docs.editor.hasPendingWrites || docs.todo.hasPendingWrites
    if (anyPending) return 'Syncing…'
    const allFromCache = docs.editor.fromCache && docs.todo.fromCache
    if (allFromCache) return 'Offline'

    const error = s.cloud.error
    if (error) return 'Error'

    return 'Synced'
  })
