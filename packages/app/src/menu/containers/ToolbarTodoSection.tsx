import React from 'react'

import { useStructuredTodos } from '../../structured-todos/hooks'

import ToolbarTodoSectionComponent from '../components/ToolbarTodoSection'

const ToolbarTodoSection: React.FC = () => {
  const { enabled, isProcessing } = useStructuredTodos()

  return (
    <ToolbarTodoSectionComponent
      structuredTodosEnabled={enabled}
      isProcessing={isProcessing}
    />
  )
}

export default ToolbarTodoSection
