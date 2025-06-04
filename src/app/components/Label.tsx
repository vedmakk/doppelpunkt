import React from 'react'
import styled from '@emotion/styled'
import { CSSObject } from '@emotion/react'

interface LabelProps {
  children: React.ReactNode
  size?: 'normal' | 'small' | 'tiny'
  className?: string
}

const StyledLabel = styled.span<{
  size?: 'normal' | 'small' | 'tiny'
}>(({ theme, size = 'normal' }) => {
  const baseStyles: CSSObject = {
    color: theme.colors.link,
    fontFamily: 'Vollkorn',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
    textAlign: 'left',
    transition: `color ${theme.animations.transition}`,
  }

  const sizeStyles: CSSObject =
    size === 'small'
      ? { fontSize: '18px' }
      : size === 'tiny'
        ? { fontSize: '14px' }
        : { fontSize: '28px' }

  return {
    ...baseStyles,
    ...sizeStyles,
  }
})

export const Label: React.FC<LabelProps> = ({
  children,
  size = 'normal',
  className,
}) => (
  <StyledLabel size={size} className={className}>
    {children}
  </StyledLabel>
)
