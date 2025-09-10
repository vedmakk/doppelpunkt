import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'

import { EditorStats } from '../../shared/types'

import { HotkeyId } from '../../hotkeys/registry'

import { Button } from '../../app/components/Button'
import {
  DestructiveButton,
  useDestructiveHotkey,
  DestructiveActionId,
  ConfirmationModal,
} from '../../destructive-actions'
import { Label } from '../../app/components/Label'
import { SectionTitle } from './SectionTitle'
import { SectionContainer } from './SectionContainer'

interface Props {
  content: string
  stats: EditorStats
  onNew: () => void
  onOpen: (text: string) => void
}

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

const ToolbarEditorSection: React.FC<Props> = ({
  content,
  stats,
  onNew,
  onOpen,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpen = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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

  // Destructive hotkeys with confirmations
  const { confirmationProps: newConfirmationProps } = useDestructiveHotkey(
    HotkeyId.NewDocument,
    onNew,
    () => Boolean(content),
  )

  const { confirmationProps: openConfirmationProps } = useDestructiveHotkey(
    HotkeyId.OpenDocument,
    handleOpen,
    () => Boolean(content),
  )

  return (
    <>
      <SectionContainer as="nav" aria-label="Editor actions">
        <SectionTitle>Actions</SectionTitle>
        <DestructiveButton
          label="New"
          configId={DestructiveActionId.NewDocument}
          onClick={onNew}
          requiresCondition={() => Boolean(content)}
        />
        <DestructiveButton
          label="Open"
          configId={DestructiveActionId.OpenDocument}
          onClick={handleOpen}
          requiresCondition={() => Boolean(content)}
        />
        <HiddenInput
          type="file"
          accept=".md"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button label="Export" onClick={handleExport} />
        <Button label="PDF" onClick={handlePDF} />
      </SectionContainer>
      <SectionContainer as="section" aria-label="Editor stats">
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
      </SectionContainer>
      {/* Confirmation modals for hotkeys */}
      <ConfirmationModal {...newConfirmationProps} />
      <ConfirmationModal {...openConfirmationProps} />
    </>
  )
}

export default ToolbarEditorSection
