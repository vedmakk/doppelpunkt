import React from 'react'
import styled from '@emotion/styled'

import { Label } from '../../app/components/Label'
import { focusVisibleStyles } from '../../shared/styles'

const StyledKbd = styled.kbd<{ isEditing: boolean; disabled?: boolean }>(
  ({ theme, isEditing, disabled }) => ({
    backgroundColor: isEditing ? theme.colors.paper : theme.colors.page,
    color: isEditing ? theme.colors.primary : theme.colors.secondary,
    borderRadius: '0.25rem',
    border: `1px solid ${isEditing ? theme.colors.primary : theme.colors.shadow}`,
    boxShadow: `0 1px 0 0.5px ${theme.colors.shadow}`,
    fontSize: theme.fontSize.kbd,
    lineHeight: '1',
    minWidth: '0.75rem',
    display: 'inline-block',
    textAlign: 'center',
    padding: '2px 5px',
    position: 'relative',
    top: '-1px',
    transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}, border ${theme.animations.transition}, box-shadow ${theme.animations.transition}`,
    ...(!disabled && {
      '&:active': {
        boxShadow: `0 0.5px 0 0.25px ${theme.colors.shadow}`,
        top: '1px',
      },
    }),
  }),
)

const StyledButton = styled.button(
  {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    '&:disabled': {
      cursor: 'auto',
    },
  },
  focusVisibleStyles,
)

interface Props {
  hotkeys: string
  isEditing: boolean
  onClick?: () => void
  disabled?: boolean
}

const KbdShortcut = ({ hotkeys, isEditing, onClick, disabled }: Props) => {
  return (
    <StyledButton type="button" onClick={onClick} disabled={disabled}>
      <Label size="tiny">
        <StyledKbd isEditing={isEditing} disabled={disabled}>
          {hotkeys.toUpperCase()}
        </StyledKbd>
      </Label>
    </StyledButton>
  )
}

export default KbdShortcut
