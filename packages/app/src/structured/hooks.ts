import { useAppSelector } from '../store'

export const useStructuredEnabled = () =>
  useAppSelector((s) => s.structured.enabled)

export const useStructuredTodos = () =>
  useAppSelector((s) => s.structured.todos)
