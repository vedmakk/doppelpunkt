import React from 'react'
import styled from '@emotion/styled'

import { Button } from '../../app/components/Button'
import { MutedLabel } from './MutedLabel'
import { SectionTitle } from './SectionTitle'
import WritingModeSwitch from '../../mode/containers/WritingModeSwitch'
import { WritingMode } from '../../mode/modeSlice'
import ToolbarTodoSection from './ToolbarTodoSection'
import ToolbarEditorSection from '../containers/ToolbarEditorSection'
import { SectionContainer } from './SectionContainer'

interface Props {
  onOpenSettings: () => void
  onOpenAutoSaveSettings: () => void
  onOpenHotkeysSettings: () => void
  mode: WritingMode
}

const ToolbarContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(6),
}))

const Toolbar: React.FC<Props> = ({
  onOpenSettings,
  onOpenAutoSaveSettings,
  onOpenHotkeysSettings,
  mode,
}) => {
  return (
    <ToolbarContainer id="toolbar">
      <SectionContainer as="section" aria-label="Writing mode">
        <SectionTitle>Mode</SectionTitle>
        <WritingModeSwitch />
      </SectionContainer>
      {mode === 'editor' ? <ToolbarEditorSection /> : <ToolbarTodoSection />}
      <SectionContainer as="nav" aria-label="Settings">
        <SectionTitle>Settings</SectionTitle>
        <Button label="General" onClick={onOpenSettings} />
        <Button label="Auto-save" onClick={onOpenAutoSaveSettings} />
        <Button label="Shortcuts" onClick={onOpenHotkeysSettings} />
      </SectionContainer>
      <SectionContainer as="section" aria-label="Project info">
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
      </SectionContainer>
      <SectionContainer as="footer" aria-label="Footer">
        <MutedLabel size="tiny">
          © 2025 <br />
          Jan Mittelman
        </MutedLabel>
      </SectionContainer>
    </ToolbarContainer>
  )
}

export default Toolbar
