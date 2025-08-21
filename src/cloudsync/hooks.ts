import { useAppSelector } from '../store'

export const useCloudEnabled = () => useAppSelector((s) => s.cloud.enabled)

export const useCloudStatus = () => useAppSelector((s) => s.cloud.status)

export const useCloudUser = () => useAppSelector((s) => s.cloud.user)

export const useCloudError = () => useAppSelector((s) => s.cloud.error)
