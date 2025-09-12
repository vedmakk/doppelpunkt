import React from 'react'

import { TodoItem } from '../structured-todos/components/TodoItem'
import { StructuredTodo } from '../structured-todos/types'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/TodoItem',
  decorators: [CommonStoryDecorator],
}

const baseTodo: StructuredTodo = {
  id: '1',
  description: 'Sample todo item',
}

export const Default = () => {
  return <TodoItem todo={baseTodo} />
}

export const Completed = () => {
  const completedTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Completed todo item',
    completed: true,
  }
  return <TodoItem todo={completedTodo} />
}

export const WithHighPriority = () => {
  const highPriorityTodo: StructuredTodo = {
    ...baseTodo,
    description: 'High priority todo item',
    priority: 'high',
  }
  return <TodoItem todo={highPriorityTodo} />
}

export const WithMediumPriority = () => {
  const mediumPriorityTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Medium priority todo item',
    priority: 'medium',
  }
  return <TodoItem todo={mediumPriorityTodo} />
}

export const WithLowPriority = () => {
  const lowPriorityTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Low priority todo item',
    priority: 'low',
  }
  return <TodoItem todo={lowPriorityTodo} />
}

export const WithDueToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueTodayTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Todo due today',
    due: today.getTime(),
  }
  return <TodoItem todo={dueTodayTodo} />
}

export const WithDueTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dueTomorrowTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Todo due tomorrow',
    due: tomorrow.getTime(),
  }
  return <TodoItem todo={dueTomorrowTodo} />
}

export const WithOverdueDate = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const overdueTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Overdue todo item',
    due: yesterday.getTime(),
  }
  return <TodoItem todo={overdueTodo} />
}

export const WithFutureDate = () => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)
  futureDate.setHours(0, 0, 0, 0)

  const futureTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Todo due next week',
    due: futureDate.getTime(),
  }
  return <TodoItem todo={futureTodo} />
}

export const FullySpecified = () => {
  const fullTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Complete todo with all properties',
    priority: 'high',
    due: new Date().getTime() + 86400000, // Tomorrow
    completed: false,
  }
  return <TodoItem todo={fullTodo} />
}

export const CompletedWithPriorityAndDate = () => {
  const completedFullTodo: StructuredTodo = {
    ...baseTodo,
    description: 'Completed todo with priority and due date',
    priority: 'medium',
    due: new Date().getTime() - 86400000, // Yesterday
    completed: true,
  }
  return <TodoItem todo={completedFullTodo} />
}

export const LongDescription = () => {
  const longDescriptionTodo: StructuredTodo = {
    ...baseTodo,
    description:
      'This is a very long todo description that should wrap to multiple lines and demonstrate how the component handles lengthy text content properly without breaking the layout',
    priority: 'low',
  }
  return <TodoItem todo={longDescriptionTodo} />
}
