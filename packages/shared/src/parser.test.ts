import { describe, it, expect } from 'bun:test'
import { parseExtractedTodos } from './parser'
import { RawTodo } from './types'

describe('parseExtractedTodos', () => {
  it('should parse basic todos', () => {
    const rawTodos: RawTodo[] = [
      { description: 'Buy groceries', priority: 'high' },
      { description: 'Call mom', due: '2025-01-15' },
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('todo-0')
    expect(result[0].description).toBe('Buy groceries')
    expect(result[0].priority).toBe('high')
    expect(result[1].id).toBe('todo-1')
    expect(result[1].description).toBe('Call mom')
    expect(result[1].due).toBeDefined()
  })

  it('should convert date strings to timestamps', () => {
    const rawTodos: RawTodo[] = [
      { description: 'Meeting', due: '2025-06-15 14:30' },
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].due).toBe(new Date('2025-06-15 14:30').getTime())
  })

  it('should handle todos with null due date', () => {
    const rawTodos: RawTodo[] = [{ description: 'No due date', due: null }]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].due).toBeUndefined()
  })

  it('should handle todos with empty due date', () => {
    const rawTodos: RawTodo[] = [{ description: 'Empty due', due: '' }]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].due).toBeUndefined()
  })

  it('should handle invalid date strings', () => {
    const rawTodos: RawTodo[] = [
      { description: 'Invalid date', due: 'not a date' },
    ]

    const result = parseExtractedTodos(rawTodos)

    // Invalid dates result in NaN timestamp, which should be filtered out
    expect(result[0].due).toBeUndefined()
  })

  it('should preserve priority values', () => {
    const rawTodos: RawTodo[] = [
      { description: 'High priority', priority: 'high' },
      { description: 'Medium priority', priority: 'medium' },
      { description: 'Low priority', priority: 'low' },
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].priority).toBe('high')
    expect(result[1].priority).toBe('medium')
    expect(result[2].priority).toBe('low')
  })

  it('should handle null priority', () => {
    const rawTodos: RawTodo[] = [{ description: 'No priority', priority: null }]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].priority).toBeUndefined()
  })

  it('should preserve completed status', () => {
    const rawTodos: RawTodo[] = [
      { description: 'Done task', completed: true },
      { description: 'Pending task', completed: false },
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].completed).toBe(true)
    expect(result[1].completed).toBe(false)
  })

  it('should filter out null entries', () => {
    const rawTodos = [
      { description: 'Valid task' },
      null,
      { description: 'Another valid task' },
    ] as RawTodo[]

    const result = parseExtractedTodos(rawTodos)

    expect(result).toHaveLength(2)
  })

  it('should filter out entries without description', () => {
    const rawTodos = [
      { description: 'Valid task' },
      { priority: 'high' } as unknown as RawTodo, // Missing description
      { description: '' }, // Empty description
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('Valid task')
  })

  it('should assign sequential IDs', () => {
    const rawTodos: RawTodo[] = [
      { description: 'First' },
      { description: 'Second' },
      { description: 'Third' },
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].id).toBe('todo-0')
    expect(result[1].id).toBe('todo-1')
    expect(result[2].id).toBe('todo-2')
  })

  it('should return empty array for empty input', () => {
    const result = parseExtractedTodos([])

    expect(result).toEqual([])
  })

  it('should handle all optional fields being undefined', () => {
    const rawTodos: RawTodo[] = [{ description: 'Simple task' }]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0]).toEqual({
      id: 'todo-0',
      description: 'Simple task',
    })
    expect(result[0].due).toBeUndefined()
    expect(result[0].priority).toBeUndefined()
    expect(result[0].completed).toBeUndefined()
  })

  it('should handle all fields populated', () => {
    const rawTodos: RawTodo[] = [
      {
        description: 'Complete task',
        due: '2025-12-31 23:59',
        priority: 'high',
        completed: true,
      },
    ]

    const result = parseExtractedTodos(rawTodos)

    expect(result[0].description).toBe('Complete task')
    expect(result[0].due).toBe(new Date('2025-12-31 23:59').getTime())
    expect(result[0].priority).toBe('high')
    expect(result[0].completed).toBe(true)
  })
})
