import React, { useState } from 'react'
import styled from '@emotion/styled'
import { StructuredTodo } from '../types'
import TodoItem from './TodoItem'
import { MutedLabel } from '../../menu/components/MutedLabel'

interface Props {
  todayTodos: StructuredTodo[]
  upcomingTodos: StructuredTodo[]
  futureTodos: StructuredTodo[]
  noDueDateTodos: StructuredTodo[]
  onToggleComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
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

const SectionHeader = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  userSelect: 'none',
})

const SectionTitle = styled.h4(({ theme }) => ({
  fontSize: theme.fontSize.small,
  fontWeight: 600,
  color: theme.colors.text,
  margin: 0,
}))

const TodoCount = styled.span(({ theme }) => ({
  fontSize: theme.fontSize.tiny,
  color: theme.colors.secondary,
  marginLeft: theme.spacing(1),
}))

const ExpandButton = styled.button(({ theme }) => ({
  background: 'none',
  border: 'none',
  color: theme.colors.secondary,
  cursor: 'pointer',
  padding: theme.spacing(0.5),
  fontSize: theme.fontSize.small,
  transition: 'transform 0.2s',
  '&[data-expanded="true"]': {
    transform: 'rotate(90deg)',
  },
}))

const TodosList = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
}))

const StatusMessage = styled.div(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.colors.secondary,
  fontSize: theme.fontSize.small,
}))

const ErrorMessage = styled.div(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '4px',
  backgroundColor: '#ff444410', // Red with transparency
  color: '#ff4444',
  fontSize: theme.fontSize.small,
}))

const EmptyMessage = styled.div(({ theme }) => ({
  padding: theme.spacing(1),
  color: theme.colors.secondary,
  fontSize: theme.fontSize.tiny,
  fontStyle: 'italic',
}))

export const StructuredTodosList: React.FC<Props> = ({
  todayTodos,
  upcomingTodos,
  futureTodos,
  noDueDateTodos,
  onToggleComplete,
  onDelete,
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
        <ErrorMessage>Error: {error}</ErrorMessage>
      </Container>
    )
  }

  if (isProcessing) {
    return (
      <Container>
        <StatusMessage>Processing todos...</StatusMessage>
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
          No structured todos yet. Write some tasks in your todo document and
          they will appear here.
        </MutedLabel>
      </Container>
    )
  }

  return (
    <Container>
      {/* Today Section */}
      {(todayTodos.length > 0 || expandedSections.has('today')) && (
        <Section>
          <SectionHeader onClick={() => toggleSection('today')}>
            <div>
              <SectionTitle>
                Today
                <TodoCount>({todayTodos.length})</TodoCount>
              </SectionTitle>
            </div>
            <ExpandButton data-expanded={expandedSections.has('today')}>
              ›
            </ExpandButton>
          </SectionHeader>
          {expandedSections.has('today') && (
            <TodosList>
              {todayTodos.length > 0 ? (
                todayTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDelete}
                  />
                ))
              ) : (
                <EmptyMessage>No tasks for today</EmptyMessage>
              )}
            </TodosList>
          )}
        </Section>
      )}

      {/* Upcoming Section */}
      {(upcomingTodos.length > 0 || expandedSections.has('upcoming')) && (
        <Section>
          <SectionHeader onClick={() => toggleSection('upcoming')}>
            <div>
              <SectionTitle>
                Upcoming
                <TodoCount>({upcomingTodos.length})</TodoCount>
              </SectionTitle>
            </div>
            <ExpandButton data-expanded={expandedSections.has('upcoming')}>
              ›
            </ExpandButton>
          </SectionHeader>
          {expandedSections.has('upcoming') && (
            <TodosList>
              {upcomingTodos.length > 0 ? (
                upcomingTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDelete}
                  />
                ))
              ) : (
                <EmptyMessage>No upcoming tasks</EmptyMessage>
              )}
            </TodosList>
          )}
        </Section>
      )}

      {/* More Section (Future + No Due Date) */}
      {(futureTodos.length > 0 || noDueDateTodos.length > 0) && (
        <Section>
          <SectionHeader onClick={() => toggleSection('more')}>
            <div>
              <SectionTitle>
                More
                <TodoCount>
                  ({futureTodos.length + noDueDateTodos.length})
                </TodoCount>
              </SectionTitle>
            </div>
            <ExpandButton data-expanded={expandedSections.has('more')}>
              ›
            </ExpandButton>
          </SectionHeader>
          {expandedSections.has('more') && (
            <TodosList>
              {futureTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                />
              ))}
              {noDueDateTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                />
              ))}
            </TodosList>
          )}
        </Section>
      )}
    </Container>
  )
}

export default StructuredTodosList
