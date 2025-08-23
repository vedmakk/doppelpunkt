import React from 'react'
import styled from '@emotion/styled'
import { StructuredTodo } from '../types'
import { Label } from '../../app/components/Label'
import { MutedLabel } from '../../menu/components/MutedLabel'

interface Props {
  todo: StructuredTodo
}

const TodoItemContainer = styled.li(() => ({}))

const TodoItemContent = styled.div(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}))

const TodoDescription = styled(Label)<{ completed: boolean }>(
  ({ theme, completed }) => ({
    color: completed ? theme.colors.secondary : theme.colors.text,
    textDecoration: completed ? 'line-through' : 'none',
    wordBreak: 'break-word',
  }),
)

const TodoMeta = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
}))

const PriorityBadge = styled(MutedLabel)<{ priority: string }>(
  ({ theme, priority }) => ({
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    borderRadius: '3px',
    fontWeight: 500,
    backgroundColor:
      priority === 'high'
        ? `${theme.colors.todoPriorityHigh}20`
        : priority === 'medium'
          ? `${theme.colors.todoPriorityMedium}20`
          : theme.colors.backdrop,
    color:
      priority === 'high'
        ? '#ff4444'
        : priority === 'medium'
          ? '#ffaa00'
          : theme.colors.secondary,
  }),
)

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  }

  // Add year if not current year
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric'
  }

  return date.toLocaleDateString(undefined, options)
}

export const TodoItem: React.FC<Props> = ({ todo }) => {
  return (
    <TodoItemContainer>
      <TodoItemContent>
        <TodoDescription completed={todo.completed || false} size="small">
          {todo.description}
        </TodoDescription>
        <TodoMeta>
          {todo.due && (
            <MutedLabel size="tiny">{formatDate(todo.due)}</MutedLabel>
          )}
          {todo.priority && (
            <PriorityBadge priority={todo.priority} size="tiny">
              {todo.priority}
            </PriorityBadge>
          )}
        </TodoMeta>
      </TodoItemContent>
    </TodoItemContainer>
  )
}

export default TodoItem
