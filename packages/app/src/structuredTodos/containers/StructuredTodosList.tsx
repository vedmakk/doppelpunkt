import React from 'react'
import { useStructuredTodos } from '../hooks'
import StructuredTodosListComponent from '../components/StructuredTodosList'

export const StructuredTodosList: React.FC = () => {
  const {
    todayTodos,
    upcomingTodos,
    futureTodos,
    noDueDateTodos,
    isProcessing,
    error,
  } = useStructuredTodos()

  return (
    <StructuredTodosListComponent
      todayTodos={todayTodos}
      upcomingTodos={upcomingTodos}
      futureTodos={futureTodos}
      noDueDateTodos={noDueDateTodos}
      isProcessing={isProcessing}
      error={error}
    />
  )
}

export default StructuredTodosList
