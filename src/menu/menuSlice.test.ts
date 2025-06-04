import { describe, it, expect } from 'bun:test'
import { toggleMenu, setShouldRender } from './menuSlice'
import { createStore } from '../store'

describe('menuSlice', () => {
  it(`should handle ${toggleMenu.type} action`, () => {
    const store = createStore()
    const getMenu = () => store.getState().menu

    // Assuming initial state: menu is closed and shouldRender is false
    expect(getMenu().isOpen).toEqual(false)
    expect(getMenu().shouldRender).toEqual(false)

    store.dispatch(toggleMenu())
    expect(getMenu().isOpen).toEqual(true)
    expect(getMenu().shouldRender).toEqual(true)

    store.dispatch(toggleMenu())
    // On second toggle, isOpen should become false.
    expect(getMenu().isOpen).toEqual(false)
    // Since the reducer doesn't reset shouldRender on closing, it remains true.
    expect(getMenu().shouldRender).toEqual(true)
  })

  it(`should handle ${setShouldRender.type} action`, () => {
    const store = createStore()
    const getMenu = () => store.getState().menu

    store.dispatch(setShouldRender(true))
    expect(getMenu().shouldRender).toEqual(true)

    store.dispatch(setShouldRender(false))
    expect(getMenu().shouldRender).toEqual(false)
  })
})
