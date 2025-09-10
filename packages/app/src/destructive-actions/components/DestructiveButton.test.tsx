import React from 'react'
import { test, expect, mock } from 'bun:test'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@emotion/react'

import { render, screen, waitFor, within } from '../../test/test-utils'
import { DestructiveButton, DestructiveActionId } from '..'
import { LIGHT_THEME } from '../../theme/theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LIGHT_THEME}>{component}</ThemeProvider>)
}

test('renders button with correct label', () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={onClickMock}
    />,
  )

  expect(screen.getByText('Delete Account')).toBeInTheDocument()
})

test('shows confirmation modal on click', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={onClickMock}
    />,
  )

  const button = screen.getByRole('button', { name: 'Delete Account' })

  await userEvent.click(button)

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data from our servers, including all your documents and settings.',
      ),
    ).toBeInTheDocument()
  })
})

test('calls onClick when confirmed', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={onClickMock}
    />,
  )

  const button = screen.getByRole('button', { name: 'Delete Account' })

  // Click the button to open modal
  await userEvent.click(button)

  // Wait for modal to appear and click confirm
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  // Find the confirm button within the dialog specifically
  const dialog = screen.getByRole('dialog')
  const confirmButton = within(dialog).getByRole('button', {
    name: 'Delete Account',
  })
  await userEvent.click(confirmButton)

  expect(onClickMock).toHaveBeenCalledTimes(1)
})

test('does not call onClick when cancelled', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={onClickMock}
    />,
  )

  const button = screen.getByText('Delete Account')

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
      label="New Document"
      configId={DestructiveActionId.NewDocument}
      onClick={onClickMock}
      requiresCondition={requiresConditionMock}
    />,
  )

  const button = screen.getByText('New Document')

  await userEvent.click(button)

  expect(requiresConditionMock).toHaveBeenCalledTimes(1)
  expect(onClickMock).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('Create New Document')).not.toBeInTheDocument()
})

test('shows confirmation when requiresCondition returns true', async () => {
  const onClickMock = mock(() => {})
  const requiresConditionMock = mock(() => true)

  renderWithTheme(
    <DestructiveButton
      label="New Document"
      configId={DestructiveActionId.NewDocument}
      onClick={onClickMock}
      requiresCondition={requiresConditionMock}
    />,
  )

  const button = screen.getByText('New Document')

  await userEvent.click(button)

  expect(requiresConditionMock).toHaveBeenCalledTimes(1)
  expect(onClickMock).not.toHaveBeenCalled()

  await waitFor(() => {
    expect(screen.getByText('Create New Document')).toBeInTheDocument()
  })
})

test('handles disabled state correctly', () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={onClickMock}
      disabled={true}
    />,
  )

  const button = screen.getByText('Delete Account')
  expect(button.closest('button')).toBeDisabled()
})

test('passes through button props correctly', () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={onClickMock}
      active={true}
      href="https://example.com"
      externalLink={true}
    />,
  )

  const button = screen.getByText('Delete Account')
  expect(button).toBeInTheDocument()

  // The button should be rendered as a link when href is provided
  expect(button.closest('a')).toHaveAttribute('href', 'https://example.com')
  expect(button.closest('a')).toHaveAttribute('target', '_blank')
})

test('uses config-based confirmation labels', async () => {
  const onClickMock = mock(() => {})

  renderWithTheme(
    <DestructiveButton
      label="Clear API Key"
      configId={DestructiveActionId.ClearApiKey}
      onClick={onClickMock}
    />,
  )

  const button = screen.getByRole('button', { name: 'Clear API Key' })

  await userEvent.click(button)

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Are you sure you want to clear your OpenAI API key? You will need to enter it again to use structured todos.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Clear Key' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
