import React from 'react'
import styled from '@emotion/styled'
import Modal from '../../app/components/Modal'
import { Button } from '../../app/components/Button'

interface ConfirmationModalProps {
  isOpen: boolean
  shouldRender: boolean
  onClose: () => void
  setShouldRender: (shouldRender: boolean) => void
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  destructive?: boolean
}

const Message = styled.p(({ theme }) => ({
  fontSize: theme.fontSize.small,
  lineHeight: 1.5,
  margin: `0 0 ${theme.spacing(3)} 0`,
  color: theme.colors.text,
}))

const Actions = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'flex-end',
}))

const DestructiveButton = styled(Button)(({ theme }) => ({
  '.button__label': {
    color: theme.colors.todoPriorityHigh,
  },
  '&:not(:disabled) .button__label:hover': {
    color: theme.colors.todoPriorityHigh,
    textDecorationColor: theme.colors.todoPriorityHigh,
  },
}))

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  shouldRender,
  onClose,
  setShouldRender,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      shouldRender={shouldRender}
      onClose={onClose}
      setShouldRender={setShouldRender}
      title={title}
    >
      <Message>{message}</Message>
      <Actions>
        <Button label={cancelLabel} onClick={onClose} />
        {destructive ? (
          <DestructiveButton label={confirmLabel} onClick={onConfirm} />
        ) : (
          <Button label={confirmLabel} onClick={onConfirm} />
        )}
      </Actions>
    </Modal>
  )
}
