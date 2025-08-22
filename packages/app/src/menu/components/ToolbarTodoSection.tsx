import React from 'react'

import { SectionTitle } from './SectionTitle'
import { SectionContainer } from './SectionContainer'
import { StructuredTodosList } from '../../structuredTodos/containers/StructuredTodosList'
import { useAppSelector } from '../../store'
import { selectStructuredTodosEnabled } from '../../structuredTodos/selectors'
import { MutedLabel } from './MutedLabel'

const ToolbarTodoSection: React.FC = () => {
  const structuredTodosEnabled = useAppSelector(selectStructuredTodosEnabled)

  return (
    <SectionContainer as="section" aria-label="Todo tools">
      <SectionTitle>Todo</SectionTitle>
      {structuredTodosEnabled ? (
        <StructuredTodosList />
      ) : (
        <MutedLabel size="tiny">
          Enable Structured Todos in settings to see your organized tasks here.
        </MutedLabel>
      )}
    </SectionContainer>
  )
}

export default ToolbarTodoSection
