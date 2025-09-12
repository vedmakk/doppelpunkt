import React, { useState } from 'react'
import styled from '@emotion/styled'

import { StructuredTodo } from '../types'

import { MutedLabel } from '../../menu/components/MutedLabel'
import TodoItem from './TodoItem'

interface Props {
  todayTodos: StructuredTodo[]
  upcomingTodos: StructuredTodo[]
  futureTodos: StructuredTodo[]
  noDueDateTodos: StructuredTodo[]
  isProcessing?: boolean
  error?: string
}

const Container = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}))

const Section = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const SectionHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: theme.spacing(1),
  cursor: 'pointer',
  userSelect: 'none',
}))

const SectionTitle = styled(MutedLabel)(() => ({
  margin: 0,
}))

const TodoCount = styled(MutedLabel)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}))

const ExpandButton = styled.button(({ theme }) => ({
  background: 'none',
  border: 'none',
  color: theme.colors.secondary,
  cursor: 'pointer',
  fontSize: theme.fontSize.small,
  padding: theme.spacing(0.5),
  transition: `transform ${theme.animations.interaction}`,
  '&[data-expanded="true"]': {
    transform: 'rotate(90deg)',
  },
}))

const TodosList = styled.ul(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  margin: 0,
  padding: theme.spacing(2),
}))

const StatusMessage = styled(MutedLabel)({})

const ErrorMessage = styled(MutedLabel)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '4px',
  backgroundColor: `${theme.colors.error}10`,
  color: theme.colors.error,
}))

const EmptyMessage = styled(MutedLabel)({
  fontStyle: 'italic',
})

export const StructuredTodosList: React.FC<Props> = ({
  todayTodos,
  upcomingTodos,
  futureTodos,
  noDueDateTodos,
  isProcessing,
  error,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['today', 'upcoming']),
  )

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage size="tiny">Error: {error}</ErrorMessage>
      </Container>
    )
  }

  if (isProcessing) {
    return (
      <Container>
        <StatusMessage size="tiny">Processing todos...</StatusMessage>
      </Container>
    )
  }

  const totalTodos =
    todayTodos.length +
    upcomingTodos.length +
    futureTodos.length +
    noDueDateTodos.length

  if (totalTodos === 0) {
    return (
      <Container>
        <MutedLabel size="tiny">
          No todos yet. Write some tasks in your todo document and they will
          appear here.
        </MutedLabel>
      </Container>
    )
  }

  return (
    <Container>
      {/* Today Section */}
      <Section>
        <SectionHeader onClick={() => toggleSection('today')}>
          <SectionTitle as="h4" size="small">
            Today
            <TodoCount size="tiny">({todayTodos.length})</TodoCount>
          </SectionTitle>
          <ExpandButton data-expanded={expandedSections.has('today')}>
            ›
          </ExpandButton>
        </SectionHeader>
        {expandedSections.has('today') && (
          <TodosList>
            {todayTodos.length > 0 ? (
              todayTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
            ) : (
              <EmptyMessage size="tiny">No tasks for today</EmptyMessage>
            )}
          </TodosList>
        )}
      </Section>

      {/* Upcoming Section */}
      {(upcomingTodos.length > 0 || expandedSections.has('upcoming')) && (
        <Section>
          <SectionHeader onClick={() => toggleSection('upcoming')}>
            <SectionTitle as="h4" size="small">
              Upcoming
              <TodoCount size="tiny">({upcomingTodos.length})</TodoCount>
            </SectionTitle>
            <ExpandButton data-expanded={expandedSections.has('upcoming')}>
              ›
            </ExpandButton>
          </SectionHeader>
          {expandedSections.has('upcoming') && (
            <TodosList>
              {upcomingTodos.length > 0 ? (
                upcomingTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))
              ) : (
                <EmptyMessage size="tiny">No upcoming tasks</EmptyMessage>
              )}
            </TodosList>
          )}
        </Section>
      )}

      {/* More Section (Future + No Due Date) */}
      {(futureTodos.length > 0 || noDueDateTodos.length > 0) && (
        <Section>
          <SectionHeader onClick={() => toggleSection('more')}>
            <SectionTitle as="h4" size="small">
              More
              <TodoCount size="tiny">
                ({futureTodos.length + noDueDateTodos.length})
              </TodoCount>
            </SectionTitle>
            <ExpandButton data-expanded={expandedSections.has('more')}>
              ›
            </ExpandButton>
          </SectionHeader>
          {expandedSections.has('more') && (
            <TodosList>
              {futureTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
              {noDueDateTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </TodosList>
          )}
        </Section>
      )}
    </Container>
  )
}

export default StructuredTodosList
