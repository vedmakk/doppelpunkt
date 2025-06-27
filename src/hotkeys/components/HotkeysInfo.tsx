import React from 'react'
import styled from '@emotion/styled'

import { HotkeyId, hotkeys } from '../registry'

import { Label } from '../../app/components/Label'
import { Button } from '../../app/components/Button'
import { Appear } from '../../app/components/Appear'

import { MutedLabel } from '../../menu/components/MutedLabel'
import HotkeysInfoItem from './HotkeysInfoItem'

interface Props {
  isEditing: boolean
  editHotkeyId?: HotkeyId
  editHotkeyKeys?: string
  onStartEditHotkey: (id: HotkeyId) => void
  onCancelEditHotkey: () => void
  onSaveEditHotkey: () => void
  onSetDefaultKeys: () => void
}

const List = styled.ul(({ theme }) => ({
  listStyle: 'none',
  margin: `0 0 ${theme.spacing(1)} 0`,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const ListItem = styled.li({
  lineHeight: '1',
})

const EditContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  backgroundColor: theme.colors.paper,
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
  borderRadius: theme.spacing(1),
  transition: `background-color ${theme.animations.transition}`,
}))

const EditButtonsContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1.5),
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
}))

export const HotkeysInfo = ({
  isEditing,
  editHotkeyId,
  editHotkeyKeys,
  onStartEditHotkey,
  onCancelEditHotkey,
  onSaveEditHotkey,
  onSetDefaultKeys,
}: Props) => {
  return (
    <>
      <List>
        {hotkeys.map((hk) => (
          <ListItem key={hk.id}>
            <HotkeysInfoItem
              hotkey={hk}
              isEditing={isEditing && editHotkeyId === hk.id}
              editHotkeyKeys={editHotkeyKeys}
              onStartEditHotkey={onStartEditHotkey}
            />
          </ListItem>
        ))}
      </List>
      {isEditing ? (
        <Appear>
          <EditContainer>
            <Label size="tiny">
              Custom shortcuts are saved in your browser’s local storage.
            </Label>
            <EditButtonsContainer>
              <Button
                label="Save"
                onClick={onSaveEditHotkey}
                disabled={!editHotkeyKeys}
              />
              <Button label="Cancel" onClick={onCancelEditHotkey} />
              <div css={{ flex: 1 }} />
              <Button label="Default" onClick={onSetDefaultKeys} />
            </EditButtonsContainer>
          </EditContainer>
        </Appear>
      ) : (
        <Appear>
          <MutedLabel size="tiny" css={{ fontStyle: 'italic' }}>
            Click shortcut to adjust.
          </MutedLabel>
        </Appear>
      )}
    </>
  )
}
