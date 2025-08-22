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
    toggleTodoComplete,
    deleteTodo,
  } = useStructuredTodos()

  return (
    <StructuredTodosListComponent
      todayTodos={todayTodos}
      upcomingTodos={upcomingTodos}
      futureTodos={futureTodos}
      noDueDateTodos={noDueDateTodos}
      onToggleComplete={toggleTodoComplete}
      onDelete={deleteTodo}
      isProcessing={isProcessing}
      error={error}
    />
  )
}

export default StructuredTodosList
