import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

import { Label } from '../../app/components/Label'
import { Appear } from '../../app/components/Appear'
import Toolbar from '../containers/Toolbar'

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
    background: theme.colors.background,
    width: '100%',
    transition: `color ${theme.animations.transition}`,
    animation: `${isOpen ? appearAnimation : disappearAnimation} ${theme.animations.transition} forwards`,
    [theme.breakpoints.toolbar]: {
      background: 'transparent',
    },
  }),
)

const MenuButton = styled.button<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  width: 22,
  height: 18,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: 4,
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

const MenuHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
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
      <MenuHeader>
        <Appear>
          <Label size="small" css={{ userSelect: 'none' }}>
            doppelp
            <span
              css={(theme) => ({
                color: theme.colors.primary,
                transition: `color ${theme.animations.transition}`,
              })}
            >
              :
            </span>
            nkt
          </Label>
        </Appear>
        <MenuButton
          onClick={toggleMenu}
          isOpen={isOpen}
          aria-label="Toggle menu"
        >
          <span />
          <span />
        </MenuButton>
      </MenuHeader>
      {shouldRender && (
        <ToolbarContainer isOpen={isOpen} onAnimationEnd={handleAnimationEnd}>
          <Toolbar />
        </ToolbarContainer>
      )}
    </>
  )
}

export default Menu
