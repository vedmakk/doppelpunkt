import React, { useCallback } from 'react'
import styled from '@emotion/styled'

import { useStoredHotkey } from '../hooks'

import { HotkeyDefinition, HotkeyId } from '../registry'

import { Label } from '../../app/components/Label'
import KbdShortcut from './KbdShortcut'

interface Props {
  hotkey: HotkeyDefinition
  isEditing: boolean
  editHotkeyKeys?: string
  onStartEditHotkey: (id: HotkeyId) => void
}

const Container = styled.div(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
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
    <Container>
      <Label size="tiny">{hotkey.description}</Label>
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
  )
}

export default HotkeysInfoItem
