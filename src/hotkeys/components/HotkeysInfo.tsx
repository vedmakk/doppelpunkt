import React from 'react'
import styled from '@emotion/styled'

import { HotkeyId, hotkeys } from '../registry'

import { Label } from '../../app/components/Label'
import HotkeysInfoItem from './HotkeysInfoItem'
import { Button } from '../../app/components/Button'
import { Appear } from '../../app/components/Appear'

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
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const ListItem = styled.li({
  lineHeight: '1',
})

const Container = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const EditContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  backgroundColor: theme.colors.paper,
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
  borderRadius: theme.spacing(1),
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
    <Container as="aside" aria-label="Keyboard Shortcuts">
      <Label size="small" css={(theme) => ({ color: theme.colors.secondary })}>
        Keyboard Shortcuts
      </Label>
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
              Custom keyboard shortcuts are stored in your browser.
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
          <Label
            size="tiny"
            css={(theme) => ({
              color: theme.colors.secondary,
              marginTop: theme.spacing(1),
            })}
          >
            Click on a shortcut to change it.
          </Label>
        </Appear>
      )}
    </Container>
  )
}
