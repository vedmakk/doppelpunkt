import React from 'react'
import styled from '@emotion/styled'

import { SectionTitle } from './SectionTitle'
import { MutedLabel } from './MutedLabel'

const Container = styled.section(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const TodoToolbarSection: React.FC = () => {
  return (
    <Container aria-label="Todo tools">
      <SectionTitle>Todo</SectionTitle>
      <MutedLabel size="tiny">Todo toolbar placeholder</MutedLabel>
    </Container>
  )
}

export default TodoToolbarSection
