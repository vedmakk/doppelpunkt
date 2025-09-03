import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../store'

import {
  selectCloudEnabled,
  selectCloudStatus,
  selectCloudUser,
  selectCloudError,
  selectCloudDocMetas,
  selectCloudSyncStatus,
} from './selectors'
import { flushAllDocumentSaves } from './cloudSlice'

export const useCloudEnabled = () => useAppSelector(selectCloudEnabled)

export const useCloudStatus = () => useAppSelector(selectCloudStatus)

export const useCloudUser = () => useAppSelector(selectCloudUser)

export const useCloudError = () => useAppSelector(selectCloudError)

export const useCloudDocMetas = () => useAppSelector(selectCloudDocMetas)

export const useCloudSyncStatus = () => useAppSelector(selectCloudSyncStatus)

export const usePageHideFlush = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handlePageHide = () => {
      dispatch(flushAllDocumentSaves())
    }

    window.addEventListener('pagehide', handlePageHide, { passive: true })

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [dispatch])
}
