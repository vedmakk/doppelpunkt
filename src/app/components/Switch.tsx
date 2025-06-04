import React from 'react'
import styled from '@emotion/styled'
import { Label } from './Label'
import { Appear } from './Appear'

interface Props {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const SwitchContainer = styled.label(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  gap: theme.spacing(1),
  userSelect: 'none',
}))

const SwitchWrapper = styled.div({
  position: 'relative',
  marginBottom: '1px', // Align with the label
})

const HiddenInput = styled.input({
  position: 'absolute',
  opacity: 0,
  width: 0,
  height: 0,
})

const Track = styled.div<{ checked: boolean }>(({ checked, theme }) => ({
  width: '24px',
  height: '16px',
  borderRadius: '16px',
  backgroundColor: checked ? theme.colors.primary : theme.colors.backdrop,
  transition: `background-color ${theme.animations.interaction}`,
}))

const Thumb = styled.div<{ checked: boolean }>(({ checked, theme }) => ({
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '12px',
  height: '12px',
  backgroundColor: theme.colors.background,
  borderRadius: '50%',
  boxShadow: `0 1px 3px ${theme.colors.shadow}`,
  transition: `transform ${theme.animations.interaction}, background-color ${theme.animations.transition}`,
  transform: checked ? 'translateX(8px)' : 'translateX(0)',
}))

const Switch: React.FC<Props> = ({ label, checked, onChange }) => {
  return (
    <Appear>
      <SwitchContainer>
        <SwitchWrapper>
          <HiddenInput
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <Track checked={checked} />
          <Thumb checked={checked} />
        </SwitchWrapper>
        {label && <Label size="tiny">{label}</Label>}
      </SwitchContainer>
    </Appear>
  )
}

export default Switch
