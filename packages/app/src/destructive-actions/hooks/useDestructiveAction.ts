import { useState, useCallback } from 'react'
import { DESTRUCTIVE_ACTION_CONFIGS } from '../config'
import { DestructiveActionId } from '../types'

export interface UseDestructiveActionOptions {
  configId: DestructiveActionId
  onAction: (e?: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) => void
  requiresCondition?: () => boolean // Optional override
}

export const useDestructiveAction = ({
  configId,
  onAction,
  requiresCondition,
}: UseDestructiveActionOptions) => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[configId]
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [shouldRenderConfirmation, setShouldRenderConfirmation] =
    useState(false)

  const executeAction = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) => {
      // Check if confirmation is needed
      const conditionCheck = requiresCondition || config.requiresCondition
      const needsConfirmation = conditionCheck ? conditionCheck() : true

      if (needsConfirmation) {
        setShouldRenderConfirmation(true)
        setIsConfirmationOpen(true)
      } else {
        onAction(e)
      }
    },
    [config, onAction, requiresCondition],
  )

  const handleConfirm = useCallback(() => {
    setIsConfirmationOpen(false)
    onAction()
  }, [onAction])

  const handleCancel = useCallback(() => {
    setIsConfirmationOpen(false)
  }, [])

  return {
    executeAction,
    confirmationProps: {
      isOpen: isConfirmationOpen,
      shouldRender: shouldRenderConfirmation,
      onClose: handleCancel,
      setShouldRender: setShouldRenderConfirmation,
      title: config.title || 'Confirm Action',
      message: config.message,
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      onConfirm: handleConfirm,
      destructive: true,
    },
  }
}
