import React from 'react'
import styled from '@emotion/styled'

import { parseHotKeys } from '../utils'

import { Label } from '../../app/components/Label'

const StyledKbd = styled.kbd(({ theme }) => ({
  backgroundColor: theme.colors.page,
  color: theme.colors.secondary,
  borderRadius: '0.25rem',
  border: `1px solid ${theme.colors.shadow}`,
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
}))

interface Props {
  hotkeys: string
}

const KbdShortcut = ({ hotkeys }: Props) => {
  const parsedHotkeys = parseHotKeys(hotkeys)

  return (
    <Label size="tiny">
      {parsedHotkeys.map((key, index) => (
        <React.Fragment key={key}>
          <StyledKbd>{key.toUpperCase()}</StyledKbd>
          {index < parsedHotkeys.length - 1 && ' + '}
        </React.Fragment>
      ))}
    </Label>
  )
}

export default KbdShortcut
