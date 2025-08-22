import React from 'react'

import { SectionTitle } from './SectionTitle'
import { MutedLabel } from './MutedLabel'
import { SectionContainer } from './SectionContainer'

const ToolbarTodoSection: React.FC = () => {
  return (
    <SectionContainer as="section" aria-label="Todo tools">
      <SectionTitle>Todo</SectionTitle>
      <MutedLabel size="tiny">Todo toolbar placeholder</MutedLabel>
    </SectionContainer>
  )
}

export default ToolbarTodoSection
