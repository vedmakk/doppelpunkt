import React from 'react'
import styled from '@emotion/styled'

import { SectionTitle } from './SectionTitle'
import { SectionContainer } from './SectionContainer'
import { StructuredTodosList } from '../../structured-todos/containers/StructuredTodosList'
import { MutedLabel } from './MutedLabel'
import { ProcessingIndicator } from '../../structured-todos/components/ProcessingIndicator'

interface Props {
  structuredTodosEnabled: boolean
  isProcessing: boolean
}

const TitleRow = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}))

const TitleText = styled(SectionTitle)({
  margin: 0,
})

const ToolbarTodoSection: React.FC<Props> = ({
  structuredTodosEnabled,
  isProcessing,
}) => {
  return (
    <SectionContainer as="section" aria-label="Todo tools">
      <TitleRow>
        <TitleText>Todo</TitleText>
        {isProcessing && (
          <ProcessingIndicator size="small" tooltip="Processing todos..." />
        )}
      </TitleRow>
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
