import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'

import { EditorStats } from '../../shared/types'

import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'
import { Button } from '../../app/components/Button'
import Tooltip from '../../app/components/Tooltip'
import Switch from '../../app/components/Switch'
import { Label } from '../../app/components/Label'

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

  return (
    <ToolbarContainer role="toolbar" aria-label="Editor actions" id="toolbar">
      <ToolbarItemContainer>
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
      <ToolbarItemContainer>
        <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
          Stats
        </Label>
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
      <ToolbarItemContainer as="aside" aria-label="Keyboard Shortcuts">
        <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
          Keyboard Shortcuts
        </Label>
        <List>
          <ListItem>
            <Label size="tiny">
              <StyledKbd>Ctrl</StyledKbd> + <StyledKbd>Shift</StyledKbd> +{' '}
              <StyledKbd>M</StyledKbd> (Mac) / <StyledKbd>Ctrl</StyledKbd> +{' '}
              <StyledKbd>M</StyledKbd> Toggle capture tab key in editor
            </Label>
          </ListItem>
          <ListItem>
            <Label size="tiny">
              <StyledKbd>Esc</StyledKbd> Toggle menu
            </Label>
          </ListItem>
        </List>
      </ToolbarItemContainer>
      <ToolbarItemContainer>
        <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
          Everything you write stays in your browser. No data is ever uploaded
          or tracked.
        </Label>
        <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
          This project is open source under the MIT License.
        </Label>
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
      <ToolbarItemContainer>
        <Label size="tiny" css={(theme) => ({ color: theme.colors.secondary })}>
          © 2025 <br />
          Jan Mittelman
        </Label>
      </ToolbarItemContainer>
    </ToolbarContainer>
  )
}

export default Toolbar
