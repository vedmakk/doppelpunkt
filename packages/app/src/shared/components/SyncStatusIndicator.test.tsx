import React from 'react'
import { test, expect } from 'bun:test'
import { ThemeProvider } from '@emotion/react'

import { render, screen } from '../../test/test-utils'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { LIGHT_THEME } from '../../theme/theme'

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={LIGHT_THEME}>{ui}</ThemeProvider>)
}

test('renders with connected status and shows tick icon', () => {
  renderWithTheme(<SyncStatusIndicator status="connected" />)

  expect(screen.getByText('Synced')).toBeInTheDocument()
  expect(screen.getByTitle('Synced with cloud')).toBeInTheDocument()

  // Check for the tick icon (polyline element)
  const svg = document.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg?.querySelector('polyline')).toBeInTheDocument()
})

test('renders with error status and shows cross icon', () => {
  renderWithTheme(<SyncStatusIndicator status="error" />)

  expect(screen.getByText('Error')).toBeInTheDocument()
  expect(screen.getByTitle('Cloud sync error')).toBeInTheDocument()

  // Check for the cross icon (two line elements)
  const svg = document.querySelector('svg')
  expect(svg).toBeInTheDocument()
  const lines = svg?.querySelectorAll('line')
  expect(lines?.length).toBe(2)
})

test('renders with pending status without icon', () => {
  renderWithTheme(<SyncStatusIndicator status="pending" />)

  expect(screen.getByText('Syncing')).toBeInTheDocument()
  expect(screen.getByTitle('Syncing changes...')).toBeInTheDocument()

  // SVG is rendered but empty (no paths) for pending status
  const svg = document.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg?.querySelector('polyline')).toBeNull()
  expect(svg?.querySelector('line')).toBeNull()
})

test('renders with disconnected status without icon', () => {
  renderWithTheme(<SyncStatusIndicator status="disconnected" />)

  expect(screen.getByText('Connecting')).toBeInTheDocument()
  expect(screen.getByTitle('Connecting to cloud...')).toBeInTheDocument()

  // SVG is rendered but empty (no paths) for disconnected status
  const svg = document.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg?.querySelector('polyline')).toBeNull()
  expect(svg?.querySelector('line')).toBeNull()
})

test('renders with disabled status without icon', () => {
  renderWithTheme(<SyncStatusIndicator status="disabled" />)

  expect(screen.getByText('Disabled')).toBeInTheDocument()
  expect(screen.getByTitle('Cloud sync is disabled')).toBeInTheDocument()

  // SVG is rendered but empty (no paths) for disabled status
  const svg = document.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg?.querySelector('polyline')).toBeNull()
  expect(svg?.querySelector('line')).toBeNull()
})

test('renders only icon when onlyIcon is true', () => {
  renderWithTheme(<SyncStatusIndicator status="connected" onlyIcon />)

  // Should have the tick icon
  const svg = document.querySelector('svg')
  expect(svg).toBeInTheDocument()

  // Should NOT have the text
  expect(screen.queryByText('Synced')).toBeNull()
})

test('renders in different sizes', () => {
  const { rerender } = renderWithTheme(
    <SyncStatusIndicator status="connected" size="small" />,
  )
  expect(screen.getByTitle('Synced with cloud')).toBeInTheDocument()

  rerender(
    <ThemeProvider theme={LIGHT_THEME}>
      <SyncStatusIndicator status="connected" size="medium" />
    </ThemeProvider>,
  )
  expect(screen.getByTitle('Synced with cloud')).toBeInTheDocument()

  rerender(
    <ThemeProvider theme={LIGHT_THEME}>
      <SyncStatusIndicator status="connected" size="large" />
    </ThemeProvider>,
  )
  expect(screen.getByTitle('Synced with cloud')).toBeInTheDocument()
})
