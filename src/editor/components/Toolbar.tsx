import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'

import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'
import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'
import Tooltip from '../../app/components/Tooltip'
import Switch from '../../app/components/Switch'
import { Appear } from '../../app/components/Appear'

interface Props {
  content: string
  pastLength: number
  futureLength: number
  autoSaveEnabled: boolean
  onToggleAutoSave: () => void
  onNew: () => void
  onOpen: (text: string) => void
  onUndo: () => void
  onRedo: () => void
}

const ToolbarContainer = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: theme.colors.background,
  borderBottom: `1px solid ${theme.colors.shadow}`,
  padding: theme.spacing(2),
  position: 'relative',
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
}))

const ToolbarSide = styled.div({
  display: 'flex',
  alignItems: 'center',
})

const ToolbarCenter = styled.div({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  pointerEvents: 'none',
  userSelect: 'none',
})

const ToolbarItemContainer = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}))

const HiddenInput = styled.input({
  display: 'none',
})

const Toolbar: React.FC<Props> = ({
  content,
  pastLength,
  futureLength,
  autoSaveEnabled,
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
      <ToolbarSide>
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
      </ToolbarSide>
      <ToolbarCenter>
        <Appear>
          <Label size="small">
            doppelp
            <span
              css={(theme) => ({
                color: theme.colors.primary,
                transition: `color ${theme.animations.transition}`,
              })}
            >
              :
            </span>
            nkt
          </Label>
        </Appear>
      </ToolbarCenter>
      <ToolbarSide>
        <ToolbarItemContainer
          css={(theme) => ({
            gap: theme.spacing(4),
          })}
        >
          <Tooltip label="Enabling this will save your content in your browser’s local storage, so you can pick up where you left off. Nothing is shared or stored online – everything stays on your device.">
            <Switch
              label="Auto-save"
              checked={autoSaveEnabled}
              onChange={onToggleAutoSave}
            />
          </Tooltip>
          <ThemeSwitch size={32} />
        </ToolbarItemContainer>
      </ToolbarSide>
    </ToolbarContainer>
  )
}

export default Toolbar
