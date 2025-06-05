import React from 'react'
import styled from '@emotion/styled'

interface Props {
  isOpen: boolean
  onClick: () => void
  size: number
}

const MenuButtonContainer = styled.button<{ size: number }>(({ size }) => ({
  width: size,
  height: size,
  padding: 0,
  margin: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  position: 'relative',
}))

const MenuButtonLineTemplate = styled.div<{ isOpen: boolean }>(({ theme }) => ({
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  position: 'absolute',
  top: 0,
  left: 0,
  transition: `transform ${theme.animations.transition}`,
  '& span': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'block',
    width: '100%',
    height: 2,
    background: theme.colors.text,
    transition: `color ${theme.animations.transition}`,
  },
}))

const FristMenuButtonLine = styled(MenuButtonLineTemplate)<{
  isOpen: boolean
}>(({ isOpen }) => ({
  transform: isOpen
    ? 'rotate(45deg) translateY(0%)'
    : 'rotate(0deg) translateY(-20%)',
}))

const SecondMenuButtonLine = styled(MenuButtonLineTemplate)<{
  isOpen: boolean
}>(({ isOpen }) => ({
  transform: isOpen
    ? 'rotate(-45deg) translateY(0%)'
    : 'rotate(0deg) translateY(20%)',
}))

const MenuButton: React.FC<Props> = ({ isOpen, onClick, size }) => {
  return (
    <MenuButtonContainer size={size} onClick={onClick}>
      <FristMenuButtonLine isOpen={isOpen}>
        <span />
      </FristMenuButtonLine>
      <SecondMenuButtonLine isOpen={isOpen}>
        <span />
      </SecondMenuButtonLine>
    </MenuButtonContainer>
  )
}

export default MenuButton
