import React from 'react'
import styled from '@emotion/styled'
import {
  FloatingPortal,
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { Button } from './Button'

interface Props {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly title?: string
  readonly children: React.ReactNode
}

const Overlay = styled.div(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  backgroundColor: theme.colors.modalBackdrop,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  transition: `background-color ${theme.animations.transition}`,
}))

const ModalContainer = styled.div(({ theme }) => ({
  backgroundColor: theme.colors.modal,
  color: theme.colors.text,
  border: `1px solid ${theme.colors.primary}`,
  borderRadius: theme.spacing(1),
  boxShadow: `0 0 ${theme.spacing(1)} 0 ${theme.colors.shadow}`,
  width: 'min(720px, 92vw)',
  maxHeight: '80vh',
  overflow: 'auto',
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
}))

const Header = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.colors.primary}`,
}))

const Title = styled.h2(({ theme }) => ({
  fontSize: theme.fontSize.normal,
  margin: 0,
}))

const Body = styled.div(({ theme }) => ({
  padding: theme.spacing(3),
}))

export const Modal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose()
    },
    whileElementsMounted: autoUpdate,
  })

  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  })
  const role = useRole(context, { role: 'dialog' })
  const { getFloatingProps } = useInteractions([dismiss, role])

  if (!isOpen) return null

  return (
    <FloatingPortal id="floating-portal">
      <Overlay onClick={onClose}>
        <ModalContainer
          ref={refs.setFloating}
          {...getFloatingProps({
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          })}
          aria-modal="true"
          aria-label={title}
        >
          {title && (
            <Header>
              <Title>{title}</Title>
              <Button label="Close" onClick={onClose} />
            </Header>
          )}
          <Body>{children}</Body>
        </ModalContainer>
      </Overlay>
    </FloatingPortal>
  )
}

export default Modal
