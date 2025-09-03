import React from 'react'
import { test, expect, mock } from 'bun:test'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@emotion/react'

import { render, screen, waitFor } from '../../test/test-utils'
import { DestructiveButton } from './DestructiveButton'
import { LIGHT_THEME } from '../../theme/theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LIGHT_THEME}>{component}</ThemeProvider>)
}

test('renders button with correct label', () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
    />,
  )

  expect(screen.getByText('Delete Item')).toBeInTheDocument()
})

test('shows confirmation modal on click', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure you want to delete this item?"
    />,
  )

  const button = screen.getByText('Delete Item')

  await userEvent.click(button)

  await waitFor(() => {
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to delete this item?'),
    ).toBeInTheDocument()
  })
})

test('calls onClick when confirmed', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
    />,
  )

  const button = screen.getByText('Delete Item')

  // Click the button to open modal
  await userEvent.click(button)

  // Wait for modal to appear and click confirm
  await waitFor(async () => {
    const confirmButton = screen.getByText('Confirm')
    await userEvent.click(confirmButton)
  })

  expect(onClickMock).toHaveBeenCalledTimes(1)
})

test('does not call onClick when cancelled', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
    />,
  )

  const button = screen.getByText('Delete Item')

  // Click the button to open modal
  await userEvent.click(button)

  // Wait for modal to appear and click cancel
  await waitFor(async () => {
    const cancelButton = screen.getByText('Cancel')
    await userEvent.click(cancelButton)
  })

  expect(onClickMock).not.toHaveBeenCalled()
})

test('skips confirmation when requiresCondition returns false', async () => {
  const onClickMock = mock(() => {})
  const requiresConditionMock = mock(() => false)

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
      requiresCondition={requiresConditionMock}
    />,
  )

  const button = screen.getByText('Delete Item')

  await userEvent.click(button)

  expect(requiresConditionMock).toHaveBeenCalledTimes(1)
  expect(onClickMock).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
})

test('shows confirmation when requiresCondition returns true', async () => {
  const onClickMock = mock(() => {})
  const requiresConditionMock = mock(() => true)

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
      requiresCondition={requiresConditionMock}
    />,
  )

  const button = screen.getByText('Delete Item')

  await userEvent.click(button)

  expect(requiresConditionMock).toHaveBeenCalledTimes(1)
  expect(onClickMock).not.toHaveBeenCalled()

  await waitFor(() => {
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
  })
})

test('handles disabled state correctly', () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
      disabled={true}
    />,
  )

  const button = screen.getByText('Delete Item')
  expect(button.closest('button')).toBeDisabled()
})

test('passes through button props correctly', () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Item"
      onClick={onClickMock}
      confirmationMessage="Are you sure?"
      active={true}
      href="https://example.com"
      externalLink={true}
    />,
  )

  const button = screen.getByText('Delete Item')
  expect(button).toBeInTheDocument()

  // The button should be rendered as a link when href is provided
  expect(button.closest('a')).toHaveAttribute('href', 'https://example.com')
  expect(button.closest('a')).toHaveAttribute('target', '_blank')
})

test('uses custom confirmation labels', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Clear Data"
      onClick={onClickMock}
      confirmationTitle="Clear All Data"
      confirmationMessage="This will remove everything"
      confirmButtonLabel="Clear All"
      cancelButtonLabel="Keep Data"
    />,
  )

  const button = screen.getByText('Clear Data')

  await userEvent.click(button)

  await waitFor(() => {
    expect(screen.getByText('Clear All Data')).toBeInTheDocument()
    expect(screen.getByText('This will remove everything')).toBeInTheDocument()
    expect(screen.getByText('Clear All')).toBeInTheDocument()
    expect(screen.getByText('Keep Data')).toBeInTheDocument()
  })
})
