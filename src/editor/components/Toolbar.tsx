import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from '@emotion/styled'

import { RootState } from '../../store'

import { clear, load, undo, redo } from '../editorSlice'

import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'
import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'

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

const ToolbarSide = styled.div`
  display: flex;
  align-items: center;
`

const ToolbarCenter = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  pointer-events: none;
  user-select: none;
`

const ToolbarItemContainer = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}))

const HiddenInput = styled.input`
  display: none;
`

const Toolbar: React.FC = () => {
  const dispatch = useDispatch()
  const content = useSelector((state: RootState) => state.editor.present)
  const pastLength = useSelector((state: RootState) => state.editor.past.length)
  const futureLength = useSelector(
    (state: RootState) => state.editor.future.length,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNew = () => {
    if (
      content &&
      !window.confirm('Discard current content and create a new document?')
    ) {
      return
    }
    dispatch(clear())
  }

  const handleOpen = () => {
    if (
      content &&
      !window.confirm('Discard current content and open a new file?')
    ) {
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result
        if (typeof text === 'string') {
          dispatch(load(text))
        }
      }
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }

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
            onClick={() => dispatch(undo())}
            disabled={!pastLength}
            variant="text"
            size="tiny"
          />
          <Button
            label="Redo"
            onClick={() => dispatch(redo())}
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
