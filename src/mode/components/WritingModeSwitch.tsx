import React from 'react'
import styled from '@emotion/styled'

import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'
import { WritingMode } from '../modeSlice'

interface Props {
  mode: WritingMode
  onSelect: (mode: WritingMode) => void
}

const SwitchContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const ButtonsRow = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}))

export const WritingModeSwitch: React.FC<Props> = ({ mode, onSelect }) => {
  return (
    <SwitchContainer aria-label="Writing mode selector">
      <Label size="tiny">Writing mode</Label>
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
    </SwitchContainer>
  )
}

export default WritingModeSwitch
