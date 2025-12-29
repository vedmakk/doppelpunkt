import React from 'react'
import { test, expect } from 'bun:test'
import { ThemeProvider } from '@emotion/react'

import { render, screen } from '../../test/test-utils'
import { EditorCloudSyncStatus } from './EditorCloudSyncStatus'
import { LIGHT_THEME } from '../../theme/theme'

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={LIGHT_THEME}>{ui}</ThemeProvider>)
}

test('renders nothing when menu is open', () => {
  const { container } = renderWithTheme(
    <EditorCloudSyncStatus status="connected" isMenuOpen={true} />,
  )

  expect(container.firstChild).toBeNull()
})

test('renders nothing when status is disabled', () => {
  const { container } = renderWithTheme(
    <EditorCloudSyncStatus status="disabled" isMenuOpen={false} />,
  )

  expect(container.firstChild).toBeNull()
})

test('does not render on initial mount for connected (non-pinned) status', () => {
  const { container } = renderWithTheme(
    <EditorCloudSyncStatus status="connected" isMenuOpen={false} />,
  )

  // TransientStatusIndicator doesn't show on initial mount for non-pinned statuses
  expect(container.querySelector('[title="Synced with cloud"]')).toBeNull()
})

test('renders on status change to connected', () => {
  const { rerender } = renderWithTheme(
    <EditorCloudSyncStatus status="pending" isMenuOpen={false} />,
  )

  // Change status to connected
  rerender(
    <ThemeProvider theme={LIGHT_THEME}>
      <EditorCloudSyncStatus status="connected" isMenuOpen={false} />
    </ThemeProvider>,
  )

  expect(screen.getByTitle('Synced with cloud')).toBeInTheDocument()
})

test('renders immediately for pending status (pinned)', () => {
  renderWithTheme(<EditorCloudSyncStatus status="pending" isMenuOpen={false} />)

  // Pending is pinned, so it shows immediately
  expect(screen.getByTitle('Syncing changes...')).toBeInTheDocument()
})

test('renders immediately for error status (pinned)', () => {
  renderWithTheme(<EditorCloudSyncStatus status="error" isMenuOpen={false} />)

  // Error is pinned, so it shows immediately
  expect(screen.getByTitle('Cloud sync error')).toBeInTheDocument()
})

test('renders immediately for disconnected status (pinned)', () => {
  renderWithTheme(
    <EditorCloudSyncStatus status="disconnected" isMenuOpen={false} />,
  )

  // Disconnected is pinned, so it shows immediately
  expect(screen.getByTitle('Connecting to cloud...')).toBeInTheDocument()
})
