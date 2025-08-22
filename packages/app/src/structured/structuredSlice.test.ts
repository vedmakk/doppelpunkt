import { describe, it, expect } from 'bun:test'
import {
  structuredTodosReducer,
  setStructuredEnabled,
  setStructuredApiKey,
  setStructuredTodos,
  clearStructuredTodos,
} from './structuredSlice'

describe('structuredSlice', () => {
  it('toggles enabled', () => {
    const state = structuredTodosReducer(undefined, setStructuredEnabled(true))
    expect(state.enabled).toBe(true)
  })

  it('sets api key', () => {
    const state = structuredTodosReducer(
      undefined,
      setStructuredApiKey('sk-test'),
    )
    expect(state.apiKey).toBe('sk-test')
  })

  it('sets and clears todos', () => {
    const withTodos = structuredTodosReducer(
      undefined,
      setStructuredTodos({ todos: [{ description: 'Test', due: null }] }),
    )
    expect(withTodos.todos.length).toBe(1)

    const cleared = structuredTodosReducer(withTodos, clearStructuredTodos())
    expect(cleared.todos.length).toBe(0)
  })
})
