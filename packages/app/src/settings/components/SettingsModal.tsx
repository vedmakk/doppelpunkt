import React, { useState } from 'react'
import styled from '@emotion/styled'

import Modal from '../../app/components/Modal'
import Switch from '../../app/components/Switch'
import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'

import { SettingsPage } from '../settingsSlice'

import { HotkeysInfo } from '../../hotkeys/containers/HotkeysInfo'
import { MutedLabel } from '../../menu/components/MutedLabel'
import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'
import { SyncStatusIndicator } from '../../shared/containers/SyncStatusIndicator'

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

  readonly structuredTodosEnabled: boolean
  readonly onToggleStructuredTodos: (enabled: boolean) => void
  readonly structuredTodosApiKeyIsSet: boolean
  readonly onUpdateApiKey: (key: string) => void
  readonly onClearApiKey: () => void
  readonly structuredTodosDependencyStatus: {
    canEnable: boolean
    disabledReason?: string
  }
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

const DisabledReasonText = styled.div(({ theme }) => ({
  fontSize: theme.fontSize.tiny,
  color: theme.colors.todoPriorityHigh,
  marginTop: theme.spacing(0.5),
  fontFamily: 'Fira Code, monospace',
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
  structuredTodosEnabled,
  onToggleStructuredTodos,
  structuredTodosApiKeyIsSet,
  onUpdateApiKey,
  onClearApiKey,
  structuredTodosDependencyStatus,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('')
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
                  Cookies will be stored in your browser and the contents of
                  your documents will be processed by third party services
                  (Google Firebase).
                </MutedLabel>
                {cloudEnabled && (
                  <>
                    <CloudStatusContainer>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <MutedLabel size="tiny">Status:</MutedLabel>
                        <SyncStatusIndicator
                          featureName="cloudSync"
                          size="small"
                        />
                      </div>
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
                <div>
                  <Switch
                    label="Enable Structured Todos"
                    checked={
                      structuredTodosEnabled &&
                      structuredTodosDependencyStatus.canEnable
                    }
                    onChange={(checked) => {
                      if (structuredTodosDependencyStatus.canEnable) {
                        onToggleStructuredTodos(checked)
                      }
                    }}
                    disabled={!structuredTodosDependencyStatus.canEnable}
                    size={24}
                  />
                  {!structuredTodosDependencyStatus.canEnable && (
                    <DisabledReasonText>
                      {structuredTodosDependencyStatus.disabledReason}
                    </DisabledReasonText>
                  )}
                </div>
                <MutedLabel size="tiny">
                  Uses AI to automatically extract and organize todos from your
                  todo document. Requires an OpenAI API key and cloud sync to be
                  enabled. Please note that the contents of your todo document
                  will be processed by third party services (Google Firebase,
                  OpenAI).
                </MutedLabel>
              </Col>
            </Row>

            {structuredTodosEnabled && (
              <>
                <Row>
                  <Col>
                    <Label size="small">OpenAI API Key</Label>
                    <MutedLabel size="tiny">
                      <strong>🔐 Security Information:</strong>
                      <br />
                      Your API key will be stored in the cloud (Firestore) and
                      is transmitted over encrypted connections. Access to your
                      API key is restricted to your login credentials.
                      <br />
                      <br />
                      <strong>⚠️ Important:</strong> Like any web application
                      that handles API keys, there are inherent security
                      considerations:
                      <ul
                        css={(theme) => ({
                          margin: `${theme.spacing(1)} 0`,
                          paddingLeft: theme.spacing(3),
                        })}
                      >
                        <li>
                          Avoid entering your API key on shared or public
                          computers
                        </li>
                        <li>Be cautious of malicious browser extensions</li>
                        <li>
                          Although we give our best to follow best practices, we
                          cannot guarantee the security of your API key
                        </li>
                        <li>
                          You can delete and regenerate your API key anytime at{' '}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            css={(theme) => ({ color: theme.colors.primary })}
                          >
                            platform.openai.com
                          </a>
                        </li>
                      </ul>
                      By using this feature, you acknowledge these
                      considerations and agree to use your own OpenAI API key.
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
                          disabled={!apiKeyInput.trim()}
                        />
                        <Button
                          label="Save Key"
                          onClick={handleApiKeySubmit}
                          disabled={!apiKeyInput.trim()}
                        />
                        {structuredTodosApiKeyIsSet && (
                          <Button
                            label="Clear Key"
                            onClick={handleApiKeyClear}
                          />
                        )}
                      </Row>
                    </InputContainer>
                    {structuredTodosApiKeyIsSet && (
                      <MutedLabel
                        size="tiny"
                        css={(theme) => ({ marginTop: theme.spacing(1) })}
                      >
                        ✅ API key is set
                      </MutedLabel>
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
