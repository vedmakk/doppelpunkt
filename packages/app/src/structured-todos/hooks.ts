import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  setProcessingMode,
  setOllamaUrl,
  setOllamaModel,
  setOllamaConnectionStatus,
  setStructuredTodosError,
} from './structuredTodosSlice'
import {
  selectStructuredTodosEnabled,
  selectTodayTodos,
  selectUpcomingTodos,
  selectFutureTodos,
  selectNoDueDateTodos,
  selectCompletedTodos,
  selectIsProcessingTodos,
  selectStructuredTodosError,
  selectStructuredTodosApiKeyIsSet,
  selectProcessingMode,
  selectOllamaConfig,
  selectOllamaConnectionStatus,
} from './selectors'
import { ProcessingMode } from './types'
import { testOllamaConnection as testOllamaConnectionService } from './ollamaService'

export const useStructuredTodos = () => {
  const dispatch = useAppDispatch()

  const enabled = useAppSelector(selectStructuredTodosEnabled)
  const apiKeyIsSet = useAppSelector(selectStructuredTodosApiKeyIsSet)
  const todayTodos = useAppSelector(selectTodayTodos)
  const upcomingTodos = useAppSelector(selectUpcomingTodos)
  const futureTodos = useAppSelector(selectFutureTodos)
  const noDueDateTodos = useAppSelector(selectNoDueDateTodos)
  const completedTodos = useAppSelector(selectCompletedTodos)
  const isProcessing = useAppSelector(selectIsProcessingTodos)
  const error = useAppSelector(selectStructuredTodosError)

  // Processing mode state
  const processingMode = useAppSelector(selectProcessingMode)
  const ollamaConfig = useAppSelector(selectOllamaConfig)
  const ollamaConnectionStatus = useAppSelector(selectOllamaConnectionStatus)

  const toggleEnabled = useCallback(
    (value: boolean) => {
      dispatch(setStructuredTodosEnabled(value))
    },
    [dispatch],
  )

  const updateApiKey = useCallback(
    (key: string) => {
      dispatch(setApiKey(key))
    },
    [dispatch],
  )

  const clearKey = useCallback(() => {
    dispatch(clearApiKey())
  }, [dispatch])

  // Processing mode functions
  const setMode = useCallback(
    (mode: ProcessingMode) => {
      dispatch(setProcessingMode(mode))
    },
    [dispatch],
  )

  const updateOllamaUrl = useCallback(
    (url: string) => {
      dispatch(setOllamaUrl(url))
    },
    [dispatch],
  )

  const updateOllamaModel = useCallback(
    (model: string) => {
      dispatch(setOllamaModel(model))
    },
    [dispatch],
  )

  const testOllamaConnection = useCallback(async () => {
    dispatch(setOllamaConnectionStatus('testing'))
    try {
      const result = await testOllamaConnectionService(ollamaConfig.url)
      dispatch(setOllamaConnectionStatus(result.success ? 'success' : 'failed'))
      if (!result.success && result.error) {
        dispatch(setStructuredTodosError(result.error))
      } else {
        dispatch(setStructuredTodosError(undefined))
      }
      return result
    } catch (error) {
      dispatch(setOllamaConnectionStatus('failed'))
      const errorMessage =
        error instanceof Error ? error.message : 'Connection failed'
      dispatch(setStructuredTodosError(errorMessage))
      return { success: false, error: errorMessage }
    }
  }, [dispatch, ollamaConfig.url])

  return {
    enabled,
    apiKeyIsSet,
    todayTodos,
    upcomingTodos,
    futureTodos,
    noDueDateTodos,
    completedTodos,
    isProcessing,
    error,
    toggleEnabled,
    updateApiKey,
    clearKey,
    // Processing mode
    processingMode,
    ollamaConfig,
    ollamaConnectionStatus,
    setMode,
    updateOllamaUrl,
    updateOllamaModel,
    testOllamaConnection,
  }
}
