import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import {
  FloatingFocusManager,
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
  readonly shouldRender: boolean
  readonly onClose: () => void
  readonly setShouldRender: (shouldRender: boolean) => void
  readonly title?: string
  readonly children: React.ReactNode
}

// Fade-in background animation
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`
// Fade-out background animation
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`
// Scale-up animation for slider container
const scaleUp = keyframes`
  from { opacity: 0; transform: scale(0.44); }
  to { opacity: 1; transform: scale(1); }
`
// Scale-down animation for slider container
const scaleDown = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.44); }
`

const Overlay = styled.div<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  position: 'fixed',
  inset: 0,
  backgroundColor: theme.colors.modalBackdrop,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  transition: `background-color ${theme.animations.transition}`,
  animation: `${isOpen ? fadeIn : fadeOut} ${theme.animations.transition} forwards`,
}))

const ModalContainer = styled.div<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  backgroundColor: theme.colors.modal,
  color: theme.colors.text,
  border: `1px solid ${theme.colors.primary}`,
  borderRadius: theme.spacing(1),
  boxShadow: `0 0 ${theme.spacing(1)} 0 ${theme.colors.shadow}`,
  width: 'min(720px, 92vw)',
  maxHeight: '80vh',
  overflow: 'auto',
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
  animation: `${isOpen ? scaleUp : scaleDown} ${theme.animations.transition} forwards`,
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
  shouldRender,
  onClose,
  setShouldRender,
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

  const handleAnimationEnd = useCallback(() => {
    if (!isOpen) {
      setShouldRender(false)
    }
  }, [isOpen, setShouldRender])

  if (!shouldRender) return null

  return (
    <FloatingPortal id="modal-portal">
      <FloatingFocusManager
        context={context}
        guards={false}
        modal
        returnFocus
        outsideElementsInert
      >
        <Overlay isOpen={isOpen} onClick={onClose}>
          <ModalContainer
            isOpen={isOpen}
            ref={refs.setFloating}
            {...getFloatingProps({
              onClick: (e: React.MouseEvent) => e.stopPropagation(),
            })}
            aria-modal="true"
            aria-label={title}
            onAnimationEnd={handleAnimationEnd}
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
      </FloatingFocusManager>
    </FloatingPortal>
  )
}

export default Modal
