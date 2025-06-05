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
  pastLength: number
  futureLength: number
  autoSaveEnabled: boolean
  stats: EditorStats
  onToggleAutoSave: () => void
  onNew: () => void
  onOpen: (text: string) => void
  onUndo: () => void
  onRedo: () => void
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

const HiddenInput = styled.input({
  display: 'none',
})

const Toolbar: React.FC<Props> = ({
  content,
  pastLength,
  futureLength,
  autoSaveEnabled,
  stats,
  onToggleAutoSave,
  onNew,
  onOpen,
  onUndo,
  onRedo,
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

  return (
    <ToolbarContainer id="toolbar">
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
        <Button label="Undo" onClick={onUndo} disabled={!pastLength} />
        <Button label="Redo" onClick={onRedo} disabled={!futureLength} />
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
        <Label size="tiny">
          {stats.wordCount === 1 ? '1 word' : `${stats.wordCount} words`}
        </Label>
        <Label size="tiny">
          {stats.characterCount === 1
            ? '1 character'
            : `${stats.characterCount} characters`}
        </Label>
        <Label size="tiny">{stats.readingTime}</Label>
      </ToolbarItemContainer>
    </ToolbarContainer>
  )
}

export default Toolbar
