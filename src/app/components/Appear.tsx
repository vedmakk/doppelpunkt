import React from 'react'

import { Theme } from '@emotion/react'

interface Props {
  children: React.ReactNode
  selector?: string
  delay?: number
}

const appearStyles = (theme: Theme, delay: number, selector?: string) => {
  const startOpacity = delay === 0 ? 0.2 : 0

  const styles = {
    animation: `appear ${theme.animations.transition}`,
    animationFillMode: 'forwards',
    animationDelay: `${delay}ms`,
    opacity: startOpacity,
    '@keyframes appear': {
      '0%': {
        opacity: startOpacity,
      },
      '100%': {
        opacity: 1,
      },
    },
  }

  return selector ? { [selector]: styles } : styles
}

export const Appear: React.FC<Props> = ({ children, selector, delay = 0 }) => {
  return (
    <span css={(theme) => appearStyles(theme, delay, selector)}>
      {children}
    </span>
  )
}
