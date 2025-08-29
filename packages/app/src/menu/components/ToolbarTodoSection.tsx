import React from 'react'

import { SectionTitle } from './SectionTitle'
import { SectionContainer } from './SectionContainer'
import { StructuredTodosList } from '../../structuredTodos/containers/StructuredTodosList'
import { MutedLabel } from './MutedLabel'

interface Props {
  structuredTodosEnabled: boolean
}

const ToolbarTodoSection: React.FC<Props> = ({ structuredTodosEnabled }) => {
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
