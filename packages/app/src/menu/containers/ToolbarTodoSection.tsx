import React from 'react'

import { useStructuredTodos } from '../../structuredTodos/hooks'

import ToolbarTodoSectionComponent from '../components/ToolbarTodoSection'

const ToolbarTodoSection: React.FC = () => {
  const { enabled } = useStructuredTodos()

  return <ToolbarTodoSectionComponent structuredTodosEnabled={enabled} />
}

export default ToolbarTodoSection
