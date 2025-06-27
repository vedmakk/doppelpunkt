import React, { useCallback } from 'react'
import styled from '@emotion/styled'

import { useStoredHotkey } from '../hooks'

import { HotkeyDefinition, HotkeyId } from '../registry'

import { Label } from '../../app/components/Label'
import { MutedLabel } from '../../menu/components/MutedLabel'
import KbdShortcut from './KbdShortcut'

interface Props {
  hotkey: HotkeyDefinition
  isEditing: boolean
  editHotkeyKeys?: string
  onStartEditHotkey: (id: HotkeyId) => void
}

const Container = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: '100%',
}))

const LabelContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}))

const HotkeysInfoItem = ({
  hotkey,
  isEditing,
  editHotkeyKeys,
  onStartEditHotkey,
}: Props) => {
  const stored = useStoredHotkey(hotkey.id)

  const handleClick = useCallback(() => {
    onStartEditHotkey(hotkey.id)
  }, [onStartEditHotkey, hotkey.id])

  return (
    <LabelContainer>
      <Container>
        <Label size="tiny">{hotkey.label}</Label>
        <KbdShortcut
          hotkeys={
            isEditing
              ? editHotkeyKeys || 'Press keys…'
              : stored || hotkey.defaultKeys
          }
          isEditing={isEditing}
          onClick={handleClick}
          disabled={isEditing}
        />
      </Container>
      <MutedLabel size="tiny">{hotkey.description}</MutedLabel>
    </LabelContainer>
  )
}

export default HotkeysInfoItem
