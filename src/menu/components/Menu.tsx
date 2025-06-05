import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

import Toolbar from '../containers/Toolbar'
import Logo from './Logo'

interface Props {
  isOpen: boolean
  shouldRender: boolean
  toggleMenu: () => void
  closeMenu: () => void
  setShouldRender: (shouldRender: boolean) => void
}

const appearAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateX(-25%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const disappearAnimation = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-25%);
  }
`

const ToolbarContainer = styled.div<{ isOpen: boolean }>(
  ({ theme, isOpen }) => ({
    width: '100%',
    transition: `color ${theme.animations.transition}`,
    animation: `${isOpen ? appearAnimation : disappearAnimation} ${theme.animations.transition} forwards`,
  }),
)

const MenuButton = styled.button<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  width: 22,
  height: 22,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '6px 4px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  '& span': {
    display: 'block',
    width: 18,
    height: 2,
    background: theme.colors.text,
    transition: `transform ${theme.animations.transition}, opacity ${theme.animations.transition}, color ${theme.animations.transition}`,
  },
  '& span:nth-of-type(1)': {
    transform: isOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none',
  },
  '& span:nth-of-type(2)': {
    transform: isOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none',
  },
}))

const MenuWrapper = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  position: 'relative',
  zIndex: 2,
}))

const MenuContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(6),
}))

const Background = styled.div<{ isOpen: boolean; shouldRender: boolean }>(
  ({ theme, isOpen, shouldRender }) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: theme.colors.paper,
    zIndex: 0,
    opacity: isOpen ? 1 : 0,
    transform: shouldRender ? 'translateX(0)' : 'translateX(-100%)',
    transition: `opacity ${theme.animations.transition}, background ${theme.animations.transition}`,
    [theme.breakpoints.toolbar]: {
      display: 'none',
    },
  }),
)

const MenuBackground = styled.div<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: `calc(1.25 * ${theme.layout.toolbarWidth})`,
  height: '100vh',
  background: theme.colors.background,
  zIndex: 1,
  transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
  transition: `transform ${theme.animations.transition}, background ${theme.animations.transition}`,
  [theme.breakpoints.toolbar]: {
    display: 'none',
  },
}))

const Menu: React.FC<Props> = ({
  isOpen,
  shouldRender,
  toggleMenu,
  setShouldRender,
}) => {
  const handleAnimationEnd = useCallback(() => {
    // After the closing animation finishes, remove the menu from the DOM
    if (!isOpen) {
      setShouldRender(false)
    }
  }, [isOpen, setShouldRender])

  return (
    <>
      <Background
        isOpen={isOpen}
        shouldRender={shouldRender}
        onClick={toggleMenu}
      />
      <MenuBackground isOpen={isOpen} />
      <MenuWrapper>
        <MenuButton
          onClick={toggleMenu}
          isOpen={isOpen}
          aria-label="Toggle menu"
        >
          <span />
          <span />
        </MenuButton>
        <MenuContainer>
          <Logo isDense={!isOpen} />
          {shouldRender && (
            <ToolbarContainer
              isOpen={isOpen}
              onAnimationEnd={handleAnimationEnd}
            >
              <Toolbar />
            </ToolbarContainer>
          )}
        </MenuContainer>
      </MenuWrapper>
    </>
  )
}

export default Menu
