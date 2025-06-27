import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'

import { EditorStats } from '../../shared/types'

import { HotkeyId } from '../../hotkeys/registry'
import { useCustomHotkey, useHasKeyboard } from '../../hotkeys/hooks'

import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'
import { Button } from '../../app/components/Button'
import Tooltip from '../../app/components/Tooltip'
import Switch from '../../app/components/Switch'
import { Label } from '../../app/components/Label'
import { MutedLabel } from './MutedLabel'
import { SectionTitle } from './SectionTitle'
import { HotkeysInfo } from '../../hotkeys/containers/HotkeysInfo'

interface Props {
  content: string
  autoSaveEnabled: boolean
  stats: EditorStats
  onToggleAutoSave: () => void
  onNew: () => void
  onOpen: (text: string) => void
}

const ToolbarContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(6),
}))

const ToolbarItemContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

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

const HiddenInput = styled.input({
  display: 'none',
})

const Toolbar: React.FC<Props> = ({
  content,
  autoSaveEnabled,
  stats,
  onToggleAutoSave,
  onNew,
  onOpen,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasKeyboard = useHasKeyboard()

  const handleNew = useCallback(() => {
    if (
      content &&
      !window.confirm('Discard current content and create a new document?')
    ) {
      return
    }
    onNew()
  }, [content, onNew])

  const handleOpen = useCallback(() => {
    if (
      content &&
      !window.confirm('Discard current content and open a new file?')
    ) {
      return
    }
    fileInputRef.current?.click()
  }, [content])

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const file = e.target.files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (ev) => {
            const text = ev.target?.result
            if (typeof text === 'string') {
              onOpen(text)
            }
          }
          reader.readAsText(file)
        }
        e.target.value = ''
      },
      [onOpen],
    )

  const handleExport = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  const handlePDF = useCallback(() => {
    window.print()
  }, [])

  // Hotkeys
  useCustomHotkey(HotkeyId.NewDocument, handleNew)
  useCustomHotkey(HotkeyId.OpenDocument, handleOpen)

  return (
    <ToolbarContainer id="toolbar">
      <ToolbarItemContainer as="nav" aria-label="Editor actions">
        <Button label="New" onClick={handleNew} />
        <Button label="Open" onClick={handleOpen} />
        <HiddenInput
          type="file"
          accept=".md"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button label="Export" onClick={handleExport} />
        <Button label="PDF" onClick={handlePDF} />
      </ToolbarItemContainer>
      <ToolbarItemContainer
        as="nav"
        aria-label="Editor settings"
        css={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <Tooltip label="Enabling this will save your content in your browser’s local storage, so you can pick up where you left off. Nothing is shared or stored online – everything stays on your device.">
          <Switch
            label="Auto-save"
            checked={autoSaveEnabled}
            onChange={onToggleAutoSave}
            size={24}
          />
        </Tooltip>
        <ThemeSwitch size={24} />
      </ToolbarItemContainer>
      <ToolbarItemContainer as="section" aria-label="Editor stats">
        <SectionTitle>Stats</SectionTitle>
        <List>
          <ListItem>
            <Label size="tiny">
              {stats.wordCount === 1 ? '1 word' : `${stats.wordCount} words`}
            </Label>
          </ListItem>
          <ListItem>
            <Label size="tiny">
              {stats.characterCount === 1
                ? '1 character'
                : `${stats.characterCount} characters`}
            </Label>
          </ListItem>
          <ListItem>
            <Label size="tiny">{stats.readingTime}</Label>
          </ListItem>
        </List>
      </ToolbarItemContainer>
      {hasKeyboard && (
        <ToolbarItemContainer as="aside" aria-label="Keyboard Shortcuts">
          <SectionTitle>Keyboard Shortcuts</SectionTitle>
          <HotkeysInfo />
        </ToolbarItemContainer>
      )}
      <ToolbarItemContainer as="section" aria-label="Editor info">
        <MutedLabel size="tiny">
          Everything you write stays in your browser. No data is ever uploaded
          or tracked.
        </MutedLabel>
        <MutedLabel size="tiny">
          This project is open source under the MIT License.
        </MutedLabel>
        <Button
          href="https://github.com/vedmakk/doppelpunkt"
          label="GitHub"
          externalLink
        />
        <Button
          href="https://www.google.com/search?q=markdown+cheat+sheet"
          label="Markdown"
          externalLink
        />
      </ToolbarItemContainer>
      <ToolbarItemContainer as="footer" aria-label="Editor footer">
        <MutedLabel size="tiny">
          © 2025 <br />
          Jan Mittelman
        </MutedLabel>
      </ToolbarItemContainer>
    </ToolbarContainer>
  )
}

export default Toolbar
