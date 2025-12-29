import React from 'react'
import { test, expect, beforeEach, afterEach } from 'bun:test'
import { render, screen } from '../../test/test-utils'

import { TransientStatusIndicator } from './TransientStatusIndicator'

let originalSetTimeout: typeof setTimeout
let originalClearTimeout: typeof clearTimeout

beforeEach(() => {
  originalSetTimeout = global.setTimeout
  originalClearTimeout = global.clearTimeout
})

afterEach(() => {
  global.setTimeout = originalSetTimeout
  global.clearTimeout = originalClearTimeout
})

test('renders nothing initially (before status change)', () => {
  const { container } = render(
    <TransientStatusIndicator statusKey="initial">
      <span data-testid="content">Status</span>
    </TransientStatusIndicator>,
  )

  // Should not render on initial mount (no status change yet)
  expect(container.firstChild).toBeNull()
})

test('shows content when statusKey changes', async () => {
  const { rerender } = render(
    <TransientStatusIndicator statusKey="status-a">
      <span data-testid="content">Status A</span>
    </TransientStatusIndicator>,
  )

  // Change the status key
  rerender(
    <TransientStatusIndicator statusKey="status-b">
      <span data-testid="content">Status B</span>
    </TransientStatusIndicator>,
  )

  // Content should be visible after status change
  expect(screen.getByTestId('content')).toBeInTheDocument()
  expect(screen.getByText('Status B')).toBeInTheDocument()
})

test('stays visible when pinned is true', async () => {
  const { rerender } = render(
    <TransientStatusIndicator statusKey="status-a" pinned>
      <span data-testid="content">Pinned Status</span>
    </TransientStatusIndicator>,
  )

  // Should be visible when pinned (even on initial mount)
  expect(screen.getByTestId('content')).toBeInTheDocument()

  // Change status key - should still be visible
  rerender(
    <TransientStatusIndicator statusKey="status-b" pinned>
      <span data-testid="content">Pinned Status</span>
    </TransientStatusIndicator>,
  )

  expect(screen.getByTestId('content')).toBeInTheDocument()
})

test('renders children correctly', () => {
  render(
    <TransientStatusIndicator statusKey="test" pinned>
      <div data-testid="child">
        <span>Nested content</span>
      </div>
    </TransientStatusIndicator>,
  )

  expect(screen.getByTestId('child')).toBeInTheDocument()
  expect(screen.getByText('Nested content')).toBeInTheDocument()
})

test('accepts custom displayDuration', () => {
  // Just verify the prop is accepted without error
  const { container } = render(
    <TransientStatusIndicator statusKey="test" displayDuration={5000} pinned>
      <span>Content</span>
    </TransientStatusIndicator>,
  )

  expect(container.firstChild).not.toBeNull()
})
