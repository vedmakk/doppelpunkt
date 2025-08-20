import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'

import { EditorStats } from '../../shared/types'

import { HotkeyId } from '../../hotkeys/registry'
import { useCustomHotkey } from '../../hotkeys/hooks'

import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'
import { MutedLabel } from './MutedLabel'
import { SectionTitle } from './SectionTitle'

interface Props {
  content: string
  stats: EditorStats
  onOpenSettings: () => void
  onOpenAutoSaveSettings: () => void
  onOpenHotkeysSettings: () => void
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
  stats,
  onOpenSettings,
  onOpenAutoSaveSettings,
  onOpenHotkeysSettings,
  onNew,
  onOpen,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      <ToolbarItemContainer as="nav" aria-label="Editor settings">
        <SectionTitle>Settings</SectionTitle>
        <Button label="General" onClick={onOpenSettings} />
        <Button label="Auto-save" onClick={onOpenAutoSaveSettings} />
        <Button label="Shortcuts" onClick={onOpenHotkeysSettings} />
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
