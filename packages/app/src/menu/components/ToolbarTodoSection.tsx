import React, { useMemo, useState } from 'react'

import { SectionTitle } from './SectionTitle'
import { MutedLabel } from './MutedLabel'
import { SectionContainer } from './SectionContainer'
import { useStructuredTodos } from '../../structured/hooks'

const ToolbarTodoSection: React.FC = () => {
  const todos = useStructuredTodos()
  const [showMore, setShowMore] = useState(false)

  const { today, upcoming, later } = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    )
    const sevenDaysOut = new Date(startOfToday)
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)

    const withDue = todos
      .map((t) => {
        const dueDate = t.due
          ? new Date((t.due as any).toDate ? (t.due as any).toDate() : t.due)
          : null
        return { ...t, dueDate }
      })
      .filter((t) => t.description.trim().length > 0)

    const today: typeof withDue = []
    const upcoming: typeof withDue = []
    const later: typeof withDue = []

    withDue.forEach((t) => {
      if (!t.dueDate) {
        // Without due date, treat as later
        later.push(t)
        return
      }
      if (t.dueDate >= startOfToday && t.dueDate <= endOfToday) {
        today.push(t)
      } else if (t.dueDate > endOfToday && t.dueDate <= sevenDaysOut) {
        upcoming.push(t)
      } else if (t.dueDate > sevenDaysOut) {
        later.push(t)
      }
    })

    const sortByDate = (a: any, b: any) => {
      const at = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER
      const bt = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER
      return at - bt
    }

    today.sort(sortByDate)
    upcoming.sort(sortByDate)
    later.sort(sortByDate)

    return { today, upcoming, later }
  }, [todos])

  const renderList = (
    items: { description: string; dueDate: Date | null }[],
  ) => {
    if (items.length === 0) return <MutedLabel size="tiny">No items</MutedLabel>
    return (
      <ul aria-live="polite">
        {items.map((t, idx) => (
          <li key={idx}>{t.description}</li>
        ))}
      </ul>
    )
  }

  const moreCount = later.length

  return (
    <SectionContainer as="section" aria-label="Todo tools">
      <SectionTitle>Todo</SectionTitle>
      <div>
        <MutedLabel size="small">Today</MutedLabel>
        {renderList(today as any)}
      </div>
      <div>
        <MutedLabel size="small">Upcoming</MutedLabel>
        {renderList(upcoming as any)}
      </div>
      {moreCount > 0 && (
        <div>
          <button
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
          >
            {showMore ? 'Hide' : `More (${moreCount})`}
          </button>
          {showMore && renderList(later as any)}
        </div>
      )}
      {todos.length === 0 && (
        <MutedLabel size="tiny">
          No structured todos yet. Write todos in your document.
        </MutedLabel>
      )}
    </SectionContainer>
  )
}

export default ToolbarTodoSection
