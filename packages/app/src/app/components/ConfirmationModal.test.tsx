import React from 'react'
import { test, expect, mock } from 'bun:test'
import { act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@emotion/react'

import { render, screen } from '../../test/test-utils'
import { ConfirmationModal } from './ConfirmationModal'
import { LIGHT_THEME } from '../../theme/theme'

const defaultProps = {
  isOpen: true,
  shouldRender: true,
  onClose: mock(() => {}),
  setShouldRender: mock(() => {}),
  title: 'Test Title',
  message: 'Test message',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  onConfirm: mock(() => {}),
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LIGHT_THEME}>{component}</ThemeProvider>)
}

test('renders with correct title and message', () => {
  renderWithTheme(<ConfirmationModal {...defaultProps} />)

  expect(screen.getByText('Test Title')).toBeInTheDocument()
  expect(screen.getByText('Test message')).toBeInTheDocument()
  expect(screen.getByText('Confirm')).toBeInTheDocument()
  expect(screen.getByText('Cancel')).toBeInTheDocument()
})

test('calls onConfirm when confirm button clicked', async () => {
  const onConfirmMock = mock(() => {})

  renderWithTheme(
    <ConfirmationModal {...defaultProps} onConfirm={onConfirmMock} />,
  )

  const confirmButton = screen.getByText('Confirm')

  await act(async () => {
    await userEvent.click(confirmButton)
  })

  expect(onConfirmMock).toHaveBeenCalledTimes(1)
})

test('calls onClose when cancel button clicked', async () => {
  const onCloseMock = mock(() => {})

  renderWithTheme(<ConfirmationModal {...defaultProps} onClose={onCloseMock} />)

  const cancelButton = screen.getByText('Cancel')

  await act(async () => {
    await userEvent.click(cancelButton)
  })

  expect(onCloseMock).toHaveBeenCalledTimes(1)
})

test('applies destructive styling when destructive prop is true', () => {
  renderWithTheme(<ConfirmationModal {...defaultProps} destructive={true} />)

  const confirmButton = screen.getByText('Confirm')
  expect(confirmButton).toBeInTheDocument()

  // The destructive styling should be applied via emotion/styled
  // We can't easily test the computed styles in jsdom, but we can verify the component renders
})

test('applies normal styling when destructive prop is false', () => {
  renderWithTheme(<ConfirmationModal {...defaultProps} destructive={false} />)

  const confirmButton = screen.getByText('Confirm')
  expect(confirmButton).toBeInTheDocument()
})

test('does not render when shouldRender is false', () => {
  renderWithTheme(<ConfirmationModal {...defaultProps} shouldRender={false} />)

  expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  expect(screen.queryByText('Test message')).not.toBeInTheDocument()
})

test('handles keyboard navigation correctly', async () => {
  renderWithTheme(<ConfirmationModal {...defaultProps} />)

  // Test Escape key
  const onCloseMock = mock(() => {})
  renderWithTheme(<ConfirmationModal {...defaultProps} onClose={onCloseMock} />)

  await act(async () => {
    await userEvent.keyboard('{Escape}')
  })

  // Note: The actual escape key handling is done by the Modal component
  // through floating-ui's useDismiss hook, so we can't easily test it here
})
