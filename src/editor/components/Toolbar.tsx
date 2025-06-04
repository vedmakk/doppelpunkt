import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'

import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'
import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'

interface Props {
  content: string
  pastLength: number
  futureLength: number
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
          <Button label="New" onClick={handleNew} variant="text" size="tiny" />
          <Button
            label="Open"
            onClick={handleOpen}
            variant="text"
            size="tiny"
          />
          <HiddenInput
            type="file"
            accept=".md"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            label="Export"
            onClick={handleExport}
            variant="text"
            size="tiny"
          />
          <Button
            label="Undo"
            onClick={onUndo}
            disabled={!pastLength}
            variant="text"
            size="tiny"
          />
          <Button
            label="Redo"
            onClick={onRedo}
            disabled={!futureLength}
            variant="text"
            size="tiny"
          />
        </ToolbarItemContainer>
      </ToolbarSide>
      <ToolbarCenter>
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
      </ToolbarCenter>
      <ToolbarSide>
        <ThemeSwitch size={32} />
      </ToolbarSide>
    </ToolbarContainer>
  )
}

export default Toolbar
