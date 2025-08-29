import React from 'react'
import styled from '@emotion/styled'

import { Button } from '../../app/components/Button'
import { WritingMode } from '../modeSlice'

interface Props {
  mode: WritingMode
  onSelect: (mode: WritingMode) => void
}

const ButtonsRow = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}))

export const WritingModeSwitch: React.FC<Props> = ({ mode, onSelect }) => {
  return (
    <ButtonsRow>
      <Button
        label="Editor"
        active={mode === 'editor'}
        onClick={() => onSelect('editor')}
      />
      <Button
        label="Todo"
        active={mode === 'todo'}
        onClick={() => onSelect('todo')}
      />
    </ButtonsRow>
  )
}

export default WritingModeSwitch
