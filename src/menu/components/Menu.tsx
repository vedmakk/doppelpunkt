import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

import Toolbar from '../containers/Toolbar'
import Logo from './Logo'
import MenuButton from './MenuButton'

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
  alignItems: 'flex-start',
  gap: theme.spacing(6),
  flex: 'min-content',
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
  width: `calc(1.2 * ${theme.layout.toolbarWidth})`,
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
        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '2rem',
          }}
        >
          <MenuButton onClick={toggleMenu} isOpen={isOpen} size={22} />
        </div>
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
