import React, { useCallback, useRef } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

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
  isOpen: boolean
  shouldRender: boolean
  toggleMenu: () => void
  closeMenu: () => void
  setShouldRender: (shouldRender: boolean) => void
}

const appearAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateX(-25%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const disappearAnimation = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-25%);
  }
`

const ToolbarContainer = styled.div<{ isOpen: boolean }>(
  ({ theme, isOpen }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
    transition: `color ${theme.animations.transition}`,
    animation: `${isOpen ? appearAnimation : disappearAnimation} ${theme.animations.transition} forwards`,
  }),
)

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
  onToggleAutoSave,
  onNew,
  onOpen,
  onUndo,
  onRedo,
  isOpen,
  shouldRender,
  toggleMenu,
  setShouldRender,
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

  const handleAnimationEnd = useCallback(() => {
    // After the closing animation finishes, remove the menu from the DOM
    if (!isOpen) {
      setShouldRender(false)
    }
  }, [isOpen, setShouldRender])

  return (
    <>
      <Appear>
        <Label size="small" css={{ userSelect: 'none' }}>
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
      <Button label="Toggle Menu" onClick={toggleMenu} />
      {shouldRender && (
        <ToolbarContainer
          id="toolbar"
          isOpen={isOpen}
          onAnimationEnd={handleAnimationEnd}
        >
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
          <ToolbarItemContainer>
            <Tooltip label="Enabling this will save your content in your browser’s local storage, so you can pick up where you left off. Nothing is shared or stored online – everything stays on your device.">
              <Switch
                label="Auto-save"
                checked={autoSaveEnabled}
                onChange={onToggleAutoSave}
              />
            </Tooltip>
            <ThemeSwitch size={32} />
          </ToolbarItemContainer>
        </ToolbarContainer>
      )}
    </>
  )
}

export default Toolbar
