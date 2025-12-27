import { useAppSelector } from '../store'

import {
  selectCloudEnabled,
  selectCloudStatus,
  selectCloudUser,
  selectCloudError,
  selectCloudDocMetas,
  selectCloudSyncStatus,
} from './selectors'

export const useCloudEnabled = () => useAppSelector(selectCloudEnabled)

export const useCloudStatus = () => useAppSelector(selectCloudStatus)

export const useCloudUser = () => useAppSelector(selectCloudUser)

export const useCloudError = () => useAppSelector(selectCloudError)

export const useCloudDocMetas = () => useAppSelector(selectCloudDocMetas)

export const useCloudSyncStatus = () => useAppSelector(selectCloudSyncStatus)
