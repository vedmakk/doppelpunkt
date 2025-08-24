import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { StructuredTodo } from './types'

// Basic selectors
export const selectStructuredTodosState = (state: RootState) =>
  state.structuredTodos

export const selectStructuredTodos = (state: RootState) =>
  state.structuredTodos.todos

export const selectStructuredTodosEnabled = (state: RootState) =>
  state.structuredTodos.enabled

export const selectIsProcessingTodos = (state: RootState) =>
  state.structuredTodos.isProcessing

export const selectStructuredTodosError = (state: RootState) =>
  state.structuredTodos.error

// Computed selectors for grouping todos
const isTodayOrPast = (timestamp: number): boolean => {
  const today = new Date()
  const date = new Date(timestamp)
  const isPast = date < today
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  return isPast || isToday
}

const isWithinDays = (timestamp: number, days: number): boolean => {
  const now = Date.now()
  const futureTime = now + days * 24 * 60 * 60 * 1000
  return timestamp <= futureTime && timestamp > now
}

export const selectTodayTodos = createSelector(
  [selectStructuredTodos],
  (todos: StructuredTodo[]) =>
    todos
      .filter((todo) => todo.due && isTodayOrPast(todo.due))
      .sort((a, b) => a.due! - b.due!),
)

export const selectUpcomingTodos = createSelector(
  [selectStructuredTodos],
  (todos: StructuredTodo[]) =>
    todos
      .filter(
        (todo) =>
          todo.due && !isTodayOrPast(todo.due) && isWithinDays(todo.due, 7),
      )
      .sort((a, b) => a.due! - b.due!),
)

export const selectFutureTodos = createSelector(
  [selectStructuredTodos],
  (todos: StructuredTodo[]) =>
    todos
      .filter(
        (todo) =>
          todo.due && !isTodayOrPast(todo.due) && !isWithinDays(todo.due, 7),
      )
      .sort((a, b) => a.due! - b.due!),
)

export const selectNoDueDateTodos = createSelector(
  [selectStructuredTodos],
  (todos: StructuredTodo[]) => todos.filter((todo) => !todo.due),
)

export const selectCompletedTodos = createSelector(
  [selectStructuredTodos],
  (todos: StructuredTodo[]) =>
    todos
      .filter((todo) => todo.completed)
      .sort((a, b) => (b.due || 0) - (a.due || 0)),
)

export const selectStructuredTodosApiKeyIsSet = (state: RootState) =>
  state.structuredTodos.apiKeyIsSet
