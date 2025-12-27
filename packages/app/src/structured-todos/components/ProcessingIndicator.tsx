import React from 'react'
import styled from '@emotion/styled'
import { css, keyframes } from '@emotion/react'

interface Props {
  size?: 'small' | 'medium'
  tooltip?: string
}

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
`

const Indicator = styled.span<{ size: NonNullable<Props['size']> }>`
  ${({ theme, size }) => {
    const sizeMap = {
      small: theme.spacing(1),
      medium: theme.spacing(1.25),
    }

    return css`
      display: inline-block;
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
      border-radius: 50%;
      background-color: ${theme.colors.primary};
      flex-shrink: 0;
      animation: ${pulse} 1.5s ease-in-out infinite;
    `
  }}
`

export const ProcessingIndicator: React.FC<Props> = ({
  size = 'small',
  tooltip = 'Processing...',
}) => {
  return <Indicator size={size} title={tooltip} />
}
