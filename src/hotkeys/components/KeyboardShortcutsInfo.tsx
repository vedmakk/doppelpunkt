import React, { useState } from 'react'
import styled from '@emotion/styled'
import { useRecordHotkey, useStoredHotkey } from '../hooks'
import { hotkeys, HotkeyDefinition } from '../registry'
import { Label } from '../../app/components/Label'
import { Button } from '../../app/components/Button'

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

interface ItemProps {
  hotkey: HotkeyDefinition
}

const Item = ({ hotkey }: ItemProps) => {
  const [editing, setEditing] = useState(false)
  const stored = useStoredHotkey(hotkey.id)
  const [keys, { start, stop, isRecording }] = useRecordHotkey(
    editing ? hotkey.id : null,
  )

  const handleCancel = () => {
    stop(false)
    setEditing(false)
  }

  const handleSave = () => {
    stop(true)
    setEditing(false)
  }

  return (
    <ListItem>
      <Label size="tiny">
        {editing ? (
          isRecording ? (
            <>
              {keys.length ? keys.join(' + ') : 'Press keys…'}{' '}
              <Button label="save" onClick={handleSave} />{' '}
              <Button label="cancel" onClick={handleCancel} />
            </>
          ) : (
            <Button label="record" onClick={start} />
          )
        ) : (
          <>
            <StyledKbd>{stored || hotkey.defaultKeys}</StyledKbd>{' '}
            {hotkey.description}{' '}
            <Button label="edit" onClick={() => setEditing(true)} />
          </>
        )}
      </Label>
    </ListItem>
  )
}

const Container = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const hasKeyboard = () => navigator.maxTouchPoints === 0

export const KeyboardShortcutsInfo = () => {
  if (!hasKeyboard()) return null
  return (
    <Container as="aside" aria-label="Keyboard Shortcuts">
      <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
        Keyboard Shortcuts
      </Label>
      <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
        Changes are stored in your browser
      </Label>
      <List>
        {hotkeys.map((hk) => (
          <Item key={hk.id} hotkey={hk} />
        ))}
      </List>
    </Container>
  )
}
