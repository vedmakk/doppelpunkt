import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from '@emotion/styled'
import { clear, load, undo, redo } from '../features/editorSlice'
import { RootState } from '../store'

const ToolbarContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
`

const Button = styled.button`
  padding: 4px 8px;
  background: #f0f0f0;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  &:hover:not([disabled]) {
    background: #e0e0e0;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

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
      <Button onClick={handleNew}>New</Button>
      <Button onClick={handleOpen}>Open</Button>
      <HiddenInput
        type="file"
        accept=".md"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button onClick={handleExport}>Export</Button>
      <Button onClick={() => dispatch(undo())} disabled={!pastLength}>
        Undo
      </Button>
      <Button onClick={() => dispatch(redo())} disabled={!futureLength}>
        Redo
      </Button>
    </ToolbarContainer>
  )
}

export default Toolbar
