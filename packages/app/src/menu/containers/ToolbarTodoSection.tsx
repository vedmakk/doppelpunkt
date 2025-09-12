import React from 'react'

import { useStructuredTodos } from '../../structured-todos/hooks'

import ToolbarTodoSectionComponent from '../components/ToolbarTodoSection'

const ToolbarTodoSection: React.FC = () => {
  const { enabled } = useStructuredTodos()

  return <ToolbarTodoSectionComponent structuredTodosEnabled={enabled} />
}

export default ToolbarTodoSection
