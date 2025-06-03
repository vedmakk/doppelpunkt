import React from 'react'
import { Interpolation, Theme } from '@emotion/react'
import { Appear } from './Appear'

interface Props {
  size: number
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

const containerStyles = (theme: Theme, size: number) =>
  ({
    width: `${size}px`,
    height: `${size}px`,
    flexShrink: 0,
    borderRadius: '25%',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backdrop,
    opacity: 1,
    willChange: 'transform, color, background-color, opacity',
    transition: `transform ${theme.animations.interaction}, color ${theme.animations.interaction}, background-color ${theme.animations.interaction}, opacity ${theme.animations.interaction}`,
    '@media (hover: hover) and (pointer: fine)': {
      ':hover': {
        transform: `scale(${theme.interactions.hoverScale})`,
        color: theme.colors.primary,
        backgroundColor: theme.colors.paper,
        opacity: theme.interactions.hoverOpacity,
      },
      [':active']: {
        transition: 'none',
        transform: `scale(${theme.interactions.activeScale})`,
        color: theme.colors.primary,
        backgroundColor: theme.colors.paper,
        opacity: theme.interactions.activeOpacity,
      },
    },
    '@media (hover: none) and (pointer: coarse)': {
      ':active': {
        transition: 'none',
        transform: `scale(${theme.interactions.activeScale})`,
        opacity: theme.interactions.activeOpacity,
      },
    },
    cursor: 'pointer',
  }) as Interpolation<Theme>

export const IconButtonWrapper = ({
  size,
  onClick,
  children,
  disabled,
}: Props) => {
  return (
    <Appear>
      <div
        css={(theme) => containerStyles(theme, size)}
        onClick={disabled ? undefined : onClick}
      >
        {children}
      </div>
    </Appear>
  )
}
