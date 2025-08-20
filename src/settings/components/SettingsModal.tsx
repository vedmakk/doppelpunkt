import React from 'react'
import styled from '@emotion/styled'

import Modal from '../../app/components/Modal'
import Switch from '../../app/components/Switch'
import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'

import { SettingsPage } from '../settingsSlice'
import { HotkeysInfo } from '../../hotkeys/containers/HotkeysInfo'
import { MutedLabel } from '../../menu/components/MutedLabel'
import { Button } from '../../app/components/Button'

interface Props {
  readonly isOpen: boolean
  readonly activePage: SettingsPage
  readonly onClose: () => void
  readonly onChangePage: (page: SettingsPage) => void
  readonly autoSaveEnabled: boolean
  readonly onToggleAutoSave: () => void
}

const Container = styled.div(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(3),
  [theme.breakpoints.toolbar]: {
    gridTemplateColumns: '220px 1fr',
  },
}))

const Nav = styled.nav(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}))

const Page = styled.section(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}))

const Row = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}))

const Col = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  activePage,
  onClose,
  onChangePage,
  autoSaveEnabled,
  onToggleAutoSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <Container>
        <Nav aria-label="Settings pages">
          <Button
            active={activePage === 'general'}
            onClick={() => onChangePage('general')}
            aria-current={activePage === 'general'}
            label="General"
          />
          <Button
            active={activePage === 'hotkeys'}
            onClick={() => onChangePage('hotkeys')}
            aria-current={activePage === 'hotkeys'}
            label="Keyboard Shortcuts"
          />
        </Nav>

        {activePage === 'general' && (
          <Page aria-label="General settings">
            <Row>
              <ThemeSwitch size={24} />
            </Row>
            <Row>
              <Col>
                <Switch
                  label="Auto-save"
                  checked={autoSaveEnabled}
                  onChange={onToggleAutoSave}
                  size={24}
                />
                <MutedLabel size="tiny">
                  Enabling this will save your content in your browser’s local
                  storage, so you can pick up where you left off. Nothing is
                  shared or stored online – everything stays on your device.
                </MutedLabel>
              </Col>
            </Row>
          </Page>
        )}

        {activePage === 'hotkeys' && (
          <Page aria-label="Keyboard shortcuts settings">
            <HotkeysInfo />
          </Page>
        )}
      </Container>
    </Modal>
  )
}

export default SettingsModal
