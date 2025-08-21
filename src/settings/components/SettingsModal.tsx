import React from 'react'
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
  readonly onSignInWithEmailLink: (email: string) => void
  readonly onSignOut: () => void
  readonly onDeleteUser: () => void
  readonly cloudStatus: CloudStatus
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

// const EmailLinkSignIn: React.FC<{ onSubmitEmail: (email: string) => void }> = ({
//   onSubmitEmail,
// }) => {
//   const [email, setEmail] = useState('')
//   return (
//     <form
//       onSubmit={(e) => {
//         e.preventDefault()
//         if (email) onSubmitEmail(email)
//       }}
//       css={(theme) => ({
//         display: 'flex',
//         gap: theme.spacing(2),
//         alignItems: 'center',
//       })}
//     >
//       <input
//         type="email"
//         placeholder="Email for magic link"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         css={(theme) => ({
//           padding: `${theme.spacing(1)}`,
//           fontFamily: 'inherit',
//           fontSize: theme.fontSize.small,
//           border: `1px solid ${theme.colors.secondary}`,
//           borderRadius: theme.spacing(1),
//           backgroundColor: theme.colors.background,
//           color: theme.colors.text,
//           outline: 'none',
//           '&:focus': {
//             borderColor: theme.colors.primary,
//           },
//         })}
//       />
//       <Button label="Send link" onClick={() => email && onSubmitEmail(email)} />
//     </form>
//   )
// }

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
  //onSignInWithEmailLink,
  onSignOut,
  onDeleteUser,
  cloudStatus,
}) => {
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
                    <div
                      css={(theme) => ({
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing(2),
                        alignItems: 'flex-start',
                        marginTop: theme.spacing(1),
                      })}
                    >
                      <MutedLabel size="tiny">
                        Status:{' '}
                        {cloudStatus === 'connected'
                          ? 'Connected to cloud (Syncing)'
                          : 'Not connected to cloud (Not syncing)'}
                      </MutedLabel>
                      {cloudUser ? (
                        <div
                          css={(theme) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            gap: theme.spacing(1),
                            alignItems: 'flex-start',
                          })}
                        >
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
                        </div>
                      ) : (
                        <div
                          css={(theme) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            gap: theme.spacing(2),
                            alignItems: 'flex-start',
                          })}
                        >
                          <Button
                            label="Sign in with Google"
                            onClick={onSignInWithGoogle}
                          />
                          {/* <EmailLinkSignIn
                            onSubmitEmail={onSignInWithEmailLink}
                          /> */}
                        </div>
                      )}
                    </div>
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
      </Container>
    </Modal>
  )
}

export default SettingsModal
