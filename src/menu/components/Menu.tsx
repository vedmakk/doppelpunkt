import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

import Toolbar from '../containers/Toolbar'
import Logo, { LogoAlignContainer } from './Logo'
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
    animation: `${isOpen ? appearAnimation : disappearAnimation} ${theme.animations.transition} forwards`,
  }),
)

const Container = styled.div<{ shouldRender: boolean }>(
  ({ theme, shouldRender }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: theme.layout.toolbarWidth,
    height: shouldRender ? '100%' : 'auto',
    [theme.breakpoints.toolbar]: {
      left: 'unset',
      top: 0,
      right: `-${theme.layout.toolbarWidth}`,
      width: theme.layout.toolbarWidth,
      height: 'unset',
    },
    '@media print': {
      display: 'none',
    },
  }),
)

const MenuWrapper = styled.div<{ isOpen: boolean; shouldRender: boolean }>(
  ({ theme, isOpen, shouldRender }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    position: 'relative',
    zIndex: 2,
    padding: `${theme.spacing(2)} ${theme.spacing(6)} ${isOpen ? theme.spacing(6) : theme.spacing(0)} ${theme.spacing(2)}`,
    backdropFilter: isOpen ? 'blur(10px)' : 'blur(0px)',
    WebkitBackdropFilter: isOpen ? 'blur(10px)' : 'blur(0px)',
    boxShadow: isOpen
      ? `0 0 ${theme.spacing(1)} 0 ${theme.colors.shadow}`
      : 'none',
    transition: `backdrop-filter ${theme.animations.transition}, box-shadow ${theme.animations.transition}`,
    minHeight: shouldRender ? '100vh' : '0',
    height: '100%',
    [theme.breakpoints.toolbar]: {
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      boxShadow: 'none',
      transition: 'none',
      minHeight: 'unset',
      height: 'unset',
    },
  }),
)

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
    zIndex: 0,
    opacity: isOpen ? 1 : 0,
    transform: shouldRender ? 'translateX(0)' : 'translateX(-100%)',
    transition: `opacity ${theme.animations.transition}, background-color ${theme.animations.transition}`,
    [theme.breakpoints.toolbar]: {
      display: 'none',
    },
  }),
)

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
    <Container shouldRender={shouldRender}>
      <Background
        isOpen={isOpen}
        shouldRender={shouldRender}
        onClick={toggleMenu}
      />
      <MenuWrapper isOpen={isOpen} shouldRender={shouldRender}>
        <LogoAlignContainer>
          <MenuButton onClick={toggleMenu} isOpen={isOpen} size={22} />
        </LogoAlignContainer>
        <MenuContainer>
          <header>
            <Logo isDense={!isOpen} />
          </header>
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
    </Container>
  )
}

export default Menu
