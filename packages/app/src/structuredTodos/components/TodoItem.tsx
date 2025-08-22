import React from 'react'
import styled from '@emotion/styled'
import { StructuredTodo } from '../types'

interface Props {
  todo: StructuredTodo
  onToggleComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

const TodoItemContainer = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: '4px',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.colors.backdrop,
  },
}))

const Checkbox = styled.input(({ theme }) => ({
  marginTop: '2px',
  cursor: 'pointer',
  accentColor: theme.colors.primary,
}))

const TodoContent = styled.div(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}))

const TodoDescription = styled.label<{ completed: boolean }>(
  ({ theme, completed }) => ({
    fontSize: theme.fontSize.small,
    color: completed ? theme.colors.secondary : theme.colors.text,
    textDecoration: completed ? 'line-through' : 'none',
    cursor: 'pointer',
    wordBreak: 'break-word',
  }),
)

const TodoMeta = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  fontSize: theme.fontSize.tiny,
  color: theme.colors.secondary,
}))

const PriorityBadge = styled.span<{ priority: string }>(
  ({ theme, priority }) => ({
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    borderRadius: '3px',
    fontSize: theme.fontSize.tiny,
    fontWeight: 500,
    backgroundColor:
      priority === 'high'
        ? '#ff444420' // Red with transparency
        : priority === 'medium'
          ? '#ffaa0020' // Orange with transparency
          : theme.colors.backdrop,
    color:
      priority === 'high'
        ? '#ff4444'
        : priority === 'medium'
          ? '#ffaa00'
          : theme.colors.secondary,
  }),
)

const DeleteButton = styled.button(({ theme }) => ({
  background: 'none',
  border: 'none',
  color: theme.colors.secondary,
  cursor: 'pointer',
  padding: theme.spacing(0.5),
  fontSize: theme.fontSize.small,
  opacity: 0.6,
  transition: 'opacity 0.2s',
  '&:hover': {
    opacity: 1,
  },
}))

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

export const TodoItem: React.FC<Props> = ({
  todo,
  onToggleComplete,
  onDelete,
}) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleComplete(todo.id, e.target.checked)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(todo.id)
  }

  return (
    <TodoItemContainer>
      <Checkbox
        type="checkbox"
        checked={todo.completed || false}
        onChange={handleCheckboxChange}
        id={`todo-${todo.id}`}
      />
      <TodoContent>
        <TodoDescription
          htmlFor={`todo-${todo.id}`}
          completed={todo.completed || false}
        >
          {todo.description}
        </TodoDescription>
        <TodoMeta>
          {todo.due && <span>{formatDate(todo.due)}</span>}
          {todo.priority && (
            <PriorityBadge priority={todo.priority}>
              {todo.priority}
            </PriorityBadge>
          )}
        </TodoMeta>
      </TodoContent>
      <DeleteButton onClick={handleDelete} aria-label="Delete todo">
        ×
      </DeleteButton>
    </TodoItemContainer>
  )
}

export default TodoItem
