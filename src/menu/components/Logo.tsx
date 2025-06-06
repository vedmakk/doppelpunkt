import React from 'react'
import styled from '@emotion/styled'

import { Appear } from '../../app/components/Appear'
import { Label } from '../../app/components/Label'

interface Props {
  isDense: boolean
}

const StyledLabel = styled(Label)<{ isDense: boolean }>(({ isDense }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  userSelect: 'none',
  '& span:nth-of-type(2)': {
    transform: isDense ? 'translateX(-100%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(3)': {
    transform: isDense ? 'translateX(-200%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(4)': {
    transform: isDense ? 'translateX(-300%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(5)': {
    transform: isDense ? 'translateX(-400%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(6)': {
    transform: isDense ? 'translateX(-500%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(7)': {
    transform: isDense ? 'translateX(-500%)' : 'none',
  },
  '& span:nth-of-type(8)': {
    transform: isDense ? 'translateX(-500%)' : 'none',
  },
  '& span:nth-of-type(9)': {
    transform: isDense ? 'translateX(-800%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(10)': {
    transform: isDense ? 'translateX(-900%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
  '& span:nth-of-type(11)': {
    transform: isDense ? 'translateX(-1000%)' : 'none',
    opacity: isDense ? 0 : 1,
  },
}))

const StyledSpan = styled.span(({ theme }) => ({
  display: 'inline-block',
  transition: `transform ${theme.animations.transition}, opacity ${theme.animations.transition}`,
}))

const Logo: React.FC<Props> = ({ isDense }) => {
  return (
    <Appear>
      <StyledLabel size="large" isDense={isDense}>
        <StyledSpan>d</StyledSpan>
        <StyledSpan>o</StyledSpan>
        <StyledSpan>p</StyledSpan>
        <StyledSpan>p</StyledSpan>
        <StyledSpan>e</StyledSpan>
        <StyledSpan>l</StyledSpan>
        <StyledSpan>p</StyledSpan>
        <StyledSpan
          css={(theme) => ({
            color: theme.colors.primary,
          })}
        >
          :
        </StyledSpan>
        <StyledSpan>n</StyledSpan>
        <StyledSpan>k</StyledSpan>
        <StyledSpan>t</StyledSpan>
      </StyledLabel>
    </Appear>
  )
}

export default Logo
