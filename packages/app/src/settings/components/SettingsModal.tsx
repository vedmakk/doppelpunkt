import React, { useState } from 'react'
import styled from '@emotion/styled'

import Modal from '../../app/components/Modal'
import Switch from '../../app/components/Switch'
import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'

import { SettingsPage } from '../settingsSlice'
import { CloudStatus } from '../../cloudsync/cloudSlice'

import { HotkeysInfo } from '../../hotkeys/containers/HotkeysInfo'
import { MutedLabel } from '../../menu/components/MutedLabel'
import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'

interface Props {
  readonly isOpen: boolean
  readonly shouldRender: boolean
  readonly activePage: SettingsPage
  readonly onClose: () => void
  readonly setShouldRender: (shouldRender: boolean) => void
  readonly onChangePage: (page: SettingsPage) => void
  readonly autoSaveEnabled: boolean
  readonly onToggleAutoSave: () => void
  readonly cloudEnabled: boolean
  readonly onToggleCloud: () => void
  readonly cloudUser: {
    uid: string
    displayName?: string | null
    email?: string | null
    photoURL?: string | null
  } | null
  readonly onSignInWithGoogle: () => void
  readonly onSignOut: () => void
  readonly onDeleteUser: () => void
  readonly cloudStatus: CloudStatus
  readonly cloudSyncStatusText?: string
  readonly structuredTodosEnabled: boolean
  readonly onToggleStructuredTodos: (enabled: boolean) => void
  readonly structuredTodosApiKey: string | null
  readonly onUpdateApiKey: (key: string) => void
  readonly onClearApiKey: () => void
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
  marginBottom: theme.spacing(2),
  [theme.breakpoints.toolbar]: {
    marginBottom: 0,
  },
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

const CloudStatusContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  alignItems: 'flex-start',
  marginTop: theme.spacing(1),
}))

const UserInfoContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  alignItems: 'flex-start',
}))

const SignInContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  alignItems: 'flex-start',
}))

const InputContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  width: '100%',
  maxWidth: '400px',
}))

const Input = styled.input(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '4px',
  border: `1px solid ${theme.colors.secondary}`,
  background: theme.colors.background,
  color: theme.colors.text,
  fontSize: theme.fontSize.small,
  fontFamily: 'monospace',
  '&:focus': {
    outline: 'none',
    borderColor: theme.colors.primary,
  },
}))

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  shouldRender,
  activePage,
  onClose,
  setShouldRender,
  onChangePage,
  autoSaveEnabled,
  onToggleAutoSave,
  cloudEnabled,
  onToggleCloud,
  cloudUser,
  onSignInWithGoogle,
  onSignOut,
  onDeleteUser,
  cloudStatus,
  cloudSyncStatusText,
  structuredTodosEnabled,
  onToggleStructuredTodos,
  structuredTodosApiKey,
  onUpdateApiKey,
  onClearApiKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(structuredTodosApiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      onUpdateApiKey(apiKeyInput.trim())
    }
  }

  const handleApiKeyClear = () => {
    setApiKeyInput('')
    onClearApiKey()
  }
  return (
    <Modal
      isOpen={isOpen}
      shouldRender={shouldRender}
      setShouldRender={setShouldRender}
      onClose={onClose}
      title="Settings"
    >
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
          <Button
            active={activePage === 'structuredTodos'}
            onClick={() => onChangePage('structuredTodos')}
            aria-current={activePage === 'structuredTodos'}
            label="Structured Todos"
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
            <Row>
              <Col>
                <Switch
                  label="Cloud sync"
                  checked={cloudEnabled}
                  onChange={onToggleCloud}
                  size={24}
                />
                <MutedLabel size="tiny">
                  Enabling this will sync your documents across devices using
                  cloud services. You will need to sign in with your account.
                  Cookies will be stored in your browser.
                </MutedLabel>
                {cloudEnabled && (
                  <>
                    <CloudStatusContainer>
                      <MutedLabel size="tiny">
                        Status:{' '}
                        {cloudSyncStatusText ||
                          (cloudStatus === 'connected'
                            ? 'Connected to cloud'
                            : 'Not connected')}
                      </MutedLabel>
                      {cloudUser ? (
                        <UserInfoContainer>
                          <Label size="small">
                            Signed in as{' '}
                            {cloudUser.displayName ||
                              cloudUser.email ||
                              cloudUser.uid}
                          </Label>
                          <Row>
                            <Button label="Sign out" onClick={onSignOut} />
                            <Button
                              label="Delete account"
                              onClick={onDeleteUser}
                            />
                          </Row>
                        </UserInfoContainer>
                      ) : (
                        <SignInContainer>
                          <Button
                            label="Sign in with Google"
                            onClick={onSignInWithGoogle}
                          />
                        </SignInContainer>
                      )}
                    </CloudStatusContainer>
                  </>
                )}
              </Col>
            </Row>
          </Page>
        )}

        {activePage === 'hotkeys' && (
          <Page aria-label="Keyboard shortcuts settings">
            <HotkeysInfo />
          </Page>
        )}

        {activePage === 'structuredTodos' && (
          <Page aria-label="Structured todos settings">
            <Row>
              <Col>
                <Switch
                  label="Enable Structured Todos"
                  checked={structuredTodosEnabled}
                  onChange={onToggleStructuredTodos}
                  size={24}
                />
                <MutedLabel size="tiny">
                  Uses AI to automatically extract and organize todos from your
                  todo document. Requires an OpenAI API key and cloud sync to be
                  enabled.
                </MutedLabel>
              </Col>
            </Row>

            {structuredTodosEnabled && (
              <>
                <Row>
                  <Col>
                    <Label size="small">OpenAI API Key</Label>
                    <MutedLabel size="tiny">
                      Your API key is stored securely in the cloud and never
                      synced back to your device.
                    </MutedLabel>
                    <InputContainer>
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-..."
                        aria-label="OpenAI API Key"
                      />
                      <Row>
                        <Button
                          label={showApiKey ? 'Hide' : 'Show'}
                          onClick={() => setShowApiKey(!showApiKey)}
                        />
                        <Button
                          label="Save Key"
                          onClick={handleApiKeySubmit}
                          disabled={!apiKeyInput.trim()}
                        />
                        {structuredTodosApiKey && (
                          <Button
                            label="Clear Key"
                            onClick={handleApiKeyClear}
                          />
                        )}
                      </Row>
                    </InputContainer>
                    {structuredTodosApiKey && (
                      <MutedLabel size="tiny">✓ API key is set</MutedLabel>
                    )}
                  </Col>
                </Row>

                {!cloudEnabled && (
                  <Row>
                    <Col>
                      <MutedLabel size="tiny">
                        ⚠️ Cloud sync must be enabled for structured todos to
                        work. Please enable cloud sync in the General settings.
                      </MutedLabel>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </Page>
        )}
      </Container>
    </Modal>
  )
}

export default SettingsModal
