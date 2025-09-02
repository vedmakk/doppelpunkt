import React, { useState, useCallback } from 'react'
import { Button } from './Button'
import { ConfirmationModal } from './ConfirmationModal'

interface DestructiveButtonProps {
  label: string
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void
  confirmationTitle?: string
  confirmationMessage: string
  confirmButtonLabel?: string
  cancelButtonLabel?: string
  disabled?: boolean
  requiresCondition?: () => boolean
  href?: string
  externalLink?: boolean
  active?: boolean
}

export const DestructiveButton: React.FC<DestructiveButtonProps> = ({
  label,
  onClick,
  confirmationTitle = 'Confirm Action',
  confirmationMessage,
  confirmButtonLabel = 'Confirm',
  cancelButtonLabel = 'Cancel',
  requiresCondition,
  disabled = false,
  href,
  externalLink = false,
  active = false,
}) => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [shouldRenderConfirmation, setShouldRenderConfirmation] =
    useState(false)

  const handleClick = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      // Check if confirmation is needed
      const needsConfirmation = requiresCondition ? requiresCondition() : true

      if (needsConfirmation) {
        setShouldRenderConfirmation(true)
        setIsConfirmationOpen(true)
      } else {
        onClick(e)
      }
    },
    [onClick, requiresCondition],
  )

  const handleConfirm = useCallback(() => {
    setIsConfirmationOpen(false)
    onClick()
  }, [onClick])

  const handleCancel = useCallback(() => {
    setIsConfirmationOpen(false)
  }, [])

  return (
    <>
      <Button
        label={label}
        onClick={handleClick}
        disabled={disabled}
        href={href}
        externalLink={externalLink}
        active={active}
      />
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        shouldRender={shouldRenderConfirmation}
        onClose={handleCancel}
        setShouldRender={setShouldRenderConfirmation}
        title={confirmationTitle}
        message={confirmationMessage}
        confirmLabel={confirmButtonLabel}
        cancelLabel={cancelButtonLabel}
        onConfirm={handleConfirm}
        destructive={true}
      />
    </>
  )
}
