import React from 'react'
import styled from '@emotion/styled'

import { useHasKeyboard } from '../hooks'

import { hotkeys } from '../registry'

import { Label } from '../../app/components/Label'
import KbdInfoItem from './KbdInfoItem'

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

export const KeyboardShortcutsInfo = () => {
  const hasKeyboard = useHasKeyboard()

  if (!hasKeyboard) return null

  return (
    <Container as="aside" aria-label="Keyboard Shortcuts">
      <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
        Keyboard Shortcuts
      </Label>
      <List>
        {hotkeys.map((hk) => (
          <ListItem key={hk.id}>
            <KbdInfoItem hotkey={hk} />
          </ListItem>
        ))}
      </List>
      <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
        Custom keyboard shortcuts are stored in your browser.
      </Label>
    </Container>
  )
}
