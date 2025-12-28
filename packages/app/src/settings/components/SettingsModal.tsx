import React, { useState } from 'react'
import styled from '@emotion/styled'

import Modal from '../../app/components/Modal'
import Switch from '../../app/components/Switch'
import { ThemeSwitch } from '../../theme/containers/ThemeSwitch'

import { SettingsPage } from '../settingsSlice'

import { HotkeysInfo } from '../../hotkeys/containers/HotkeysInfo'
import { MutedLabel } from '../../menu/components/MutedLabel'
import { Button } from '../../app/components/Button'
import {
  DestructiveButton,
  DestructiveActionId,
} from '../../destructive-actions'
import { Label } from '../../app/components/Label'
import { SyncStatusIndicator } from '../../shared/containers/SyncStatusIndicator'
import {
  ProcessingMode,
  OllamaConnectionStatus,
} from '../../structured-todos/types'

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

  // Processing mode props
  readonly processingMode: ProcessingMode
  readonly ollamaUrl: string
  readonly ollamaModel: string
  readonly ollamaConnectionStatus: OllamaConnectionStatus
  readonly ollamaConnectionError?: string
  readonly onChangeProcessingMode: (mode: ProcessingMode) => void
  readonly onUpdateOllamaUrl: (url: string) => void
  readonly onUpdateOllamaModel: (model: string) => void
  readonly onTestOllamaConnection: () => Promise<{ success: boolean }>
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

const SpaceBetweenRow = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
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
  width: '100%',
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
  color: theme.colors.error,
  marginTop: theme.spacing(0.5),
  fontFamily: 'Fira Code, monospace',
}))

const RadioGroup = styled.div(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  marginTop: theme.spacing(1),
}))

const RadioLabel = styled.label<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontSize: theme.fontSize.small,
    fontFamily: 'Fira Code, monospace',
    lineHeight: 1,
  }),
)

const RadioInput = styled.input(({ theme }) => ({
  cursor: 'pointer',
  accentColor: theme.colors.primary,
  margin: 0,
  width: '16px',
  height: '16px',
}))

const ConnectionStatus = styled.span<{
  status: 'untested' | 'success' | 'failed' | 'testing'
}>(({ theme, status }) => ({
  fontSize: theme.fontSize.tiny,
  fontFamily: 'Fira Code, monospace',
  color:
    status === 'success'
      ? '#4caf50'
      : status === 'failed'
        ? theme.colors.error
        : status === 'testing'
          ? '#ff9800'
          : theme.colors.secondary,
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
  processingMode,
  ollamaUrl,
  ollamaModel,
  ollamaConnectionStatus,
  ollamaConnectionError,
  onChangeProcessingMode,
  onUpdateOllamaUrl,
  onUpdateOllamaModel,
  onTestOllamaConnection,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const getConnectionStatusText = (status: OllamaConnectionStatus) => {
    switch (status) {
      case 'success':
        return 'Connected'
      case 'failed':
        return 'Failed'
      case 'testing':
        return 'Testing...'
      default:
        return 'Not tested'
    }
  }

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
                          <SpaceBetweenRow>
                            <Button label="Sign out" onClick={onSignOut} />
                            <DestructiveButton
                              label="Delete account"
                              configId={DestructiveActionId.DeleteAccount}
                              onClick={onDeleteUser}
                            />
                          </SpaceBetweenRow>
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
            {/* Processing Mode Selector */}
            <Row>
              <Col>
                <Label size="small">Processing Mode</Label>
                <MutedLabel size="tiny">
                  Choose where to process your todos: Cloud (OpenAI via
                  Firebase) or Local (Ollama on your machine).
                </MutedLabel>
                <RadioGroup>
                  <RadioLabel disabled={!cloudEnabled}>
                    <RadioInput
                      type="radio"
                      name="processingMode"
                      value="cloud"
                      checked={processingMode === 'cloud'}
                      onChange={() => onChangeProcessingMode('cloud')}
                      disabled={!cloudEnabled}
                    />
                    Cloud (OpenAI)
                  </RadioLabel>
                  <RadioLabel>
                    <RadioInput
                      type="radio"
                      name="processingMode"
                      value="local"
                      checked={processingMode === 'local'}
                      onChange={() => onChangeProcessingMode('local')}
                    />
                    Local (Ollama)
                  </RadioLabel>
                </RadioGroup>
              </Col>
            </Row>

            {/* Enable Toggle */}
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
                  {/* Only show cloud-related errors here; model error shown under model field */}
                  {!structuredTodosDependencyStatus.canEnable &&
                    processingMode === 'cloud' && (
                      <DisabledReasonText>
                        {structuredTodosDependencyStatus.disabledReason}
                      </DisabledReasonText>
                    )}
                </div>
                <MutedLabel size="tiny">
                  {processingMode === 'cloud'
                    ? 'Uses AI to automatically extract and organize todos from your todo document. Cloud sync is required to securely store your API key and access the processing service. Please note that the contents of your todo document will be processed by third party services (Google Firebase, OpenAI).'
                    : 'Uses AI to automatically extract and organize todos from your todo document. Processing happens entirely on your local machine using Ollama. Nothing is sent to external servers.'}
                </MutedLabel>
              </Col>
            </Row>

            {/* Cloud Mode Settings */}
            {structuredTodosEnabled && processingMode === 'cloud' && (
              <>
                <Row>
                  <Col>
                    <Label size="small">OpenAI API Key</Label>
                    <MutedLabel size="tiny">
                      <strong>Security Information:</strong>
                      <br />
                      Your API key is encrypted and stored securely in the
                      cloud. It is encrypted both in transit and at rest, and
                      can only be decrypted by the server when processing your
                      todos.
                      <br />
                      <br />
                      <strong>Important:</strong> Like any web application that
                      handles API keys, there are inherent security
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

                    {structuredTodosApiKeyIsSet ? (
                      <SpaceBetweenRow
                        css={(theme) => ({ marginTop: theme.spacing(1) })}
                      >
                        <Label size="tiny">
                          API key is stored encrypted in the cloud.
                        </Label>
                        <DestructiveButton
                          label="Clear Key"
                          configId={DestructiveActionId.ClearApiKey}
                          onClick={handleApiKeyClear}
                        />
                      </SpaceBetweenRow>
                    ) : (
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
                        </Row>
                      </InputContainer>
                    )}
                  </Col>
                </Row>
                {!cloudEnabled && (
                  <Row>
                    <Col>
                      <MutedLabel size="tiny">
                        Cloud sync must be enabled to store your API key and
                        access the processing service. Please enable cloud sync
                        in the General settings.
                      </MutedLabel>
                    </Col>
                  </Row>
                )}
              </>
            )}

            {/* Local Mode Settings */}
            {structuredTodosEnabled && processingMode === 'local' && (
              <>
                <Row>
                  <Col>
                    <Label size="small">Ollama Server URL</Label>
                    <MutedLabel size="tiny">
                      The URL of your local Ollama instance. Default is
                      http://localhost:11434.
                    </MutedLabel>
                    <InputContainer>
                      <Input
                        type="text"
                        value={ollamaUrl}
                        onChange={(e) => onUpdateOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        aria-label="Ollama Server URL"
                      />
                    </InputContainer>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label size="small">Ollama Model</Label>
                    <MutedLabel size="tiny">
                      Specify the model to use (e.g., llama3.2, mistral,
                      codellama). The model must be installed in Ollama. Run
                      &quot;ollama pull [model]&quot; to install a model.
                    </MutedLabel>
                    <InputContainer>
                      <Input
                        type="text"
                        value={ollamaModel}
                        onChange={(e) => onUpdateOllamaModel(e.target.value)}
                        placeholder="llama3.2"
                        aria-label="Ollama Model"
                      />
                      {!ollamaModel && (
                        <DisabledReasonText>
                          Please specify an Ollama model
                        </DisabledReasonText>
                      )}
                    </InputContainer>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Row>
                      <Button
                        label={
                          ollamaConnectionStatus === 'testing'
                            ? 'Testing...'
                            : 'Test Connection'
                        }
                        onClick={onTestOllamaConnection}
                        disabled={
                          !ollamaUrl || ollamaConnectionStatus === 'testing'
                        }
                      />
                      <ConnectionStatus status={ollamaConnectionStatus}>
                        {getConnectionStatusText(ollamaConnectionStatus)}
                      </ConnectionStatus>
                    </Row>
                    {ollamaConnectionStatus === 'failed' &&
                      ollamaConnectionError && (
                        <DisabledReasonText>
                          {ollamaConnectionError}
                        </DisabledReasonText>
                      )}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <MutedLabel size="tiny">
                      <strong>Local Processing:</strong> Your todos are
                      processed entirely on your machine. Nothing is sent to
                      external servers. Make sure Ollama is running before
                      enabling structured todos.
                    </MutedLabel>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <MutedLabel size="tiny">
                      <strong>Troubleshooting:</strong> If you cannot connect to
                      Ollama running on a different machine or port, you may
                      need to configure CORS. Start Ollama with the environment
                      variable <code>OLLAMA_ORIGINS=*</code> (or specify your
                      app&apos;s origin). Example:{' '}
                      <code>OLLAMA_ORIGINS=* ollama serve</code>
                    </MutedLabel>
                  </Col>
                </Row>
              </>
            )}
          </Page>
        )}
      </Container>
    </Modal>
  )
}

export default SettingsModal
