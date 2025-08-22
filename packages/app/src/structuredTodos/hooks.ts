import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import {
  setStructuredTodosEnabled,
  setApiKey,
  clearApiKey,
  updateStructuredTodo,
  removeStructuredTodo,
} from './structuredTodosSlice'
import {
  selectStructuredTodosEnabled,
  selectStructuredTodosApiKey,
  selectTodayTodos,
  selectUpcomingTodos,
  selectFutureTodos,
  selectNoDueDateTodos,
  selectCompletedTodos,
  selectIsProcessingTodos,
  selectStructuredTodosError,
} from './selectors'

export const useStructuredTodos = () => {
  const dispatch = useAppDispatch()

  const enabled = useAppSelector(selectStructuredTodosEnabled)
  const apiKey = useAppSelector(selectStructuredTodosApiKey)
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

  const toggleTodoComplete = useCallback(
    (id: string, completed: boolean) => {
      dispatch(updateStructuredTodo({ id, updates: { completed } }))
    },
    [dispatch],
  )

  const deleteTodo = useCallback(
    (id: string) => {
      dispatch(removeStructuredTodo(id))
    },
    [dispatch],
  )

  return {
    enabled,
    apiKey,
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
    toggleTodoComplete,
    deleteTodo,
  }
}
