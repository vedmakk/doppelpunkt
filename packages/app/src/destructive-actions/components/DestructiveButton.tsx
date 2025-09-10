import React from 'react'
import { Button } from '../../app/components/Button'
import { ConfirmationModal } from './ConfirmationModal'
import { useDestructiveAction } from '../hooks/useDestructiveAction'
import { DestructiveActionId } from '../types'

export interface DestructiveButtonProps {
  label: string
  configId: DestructiveActionId
  onClick: (e?: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) => void
  requiresCondition?: () => boolean
  disabled?: boolean
  href?: string
  externalLink?: boolean
  active?: boolean
}

export const DestructiveButton: React.FC<DestructiveButtonProps> = ({
  label,
  configId,
  onClick,
  requiresCondition,
  disabled = false,
  href,
  externalLink = false,
  active = false,
}) => {
  const { executeAction, confirmationProps } = useDestructiveAction({
    configId,
    onAction: onClick,
    requiresCondition,
  })

  return (
    <>
      <Button
        label={label}
        onClick={executeAction}
        disabled={disabled}
        href={href}
        externalLink={externalLink}
        active={active}
      />
      <ConfirmationModal {...confirmationProps} />
    </>
  )
}
