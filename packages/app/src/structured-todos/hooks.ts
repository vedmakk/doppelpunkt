import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
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
} from './selectors'

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
  }
}
