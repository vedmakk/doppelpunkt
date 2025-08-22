import React from 'react'
import styled from '@emotion/styled'

import Menu from '../../menu/containers/Menu'
import MarkdownEditor from '../../editor/containers/MarkdownEditor'
import SettingsModal from '../../settings/containers/SettingsModal'

const AppContainer = styled.div({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  minHeight: '100vh',
  '@media print': {
    minHeight: 'auto',
  },
})

const LayoutContainer = styled.div(({ theme }) => ({
  margin: 0,
  width: '100%',
  position: 'relative',
  [theme.breakpoints.toolbar]: {
    width: 'fit-content',
    margin: `${theme.spacing(4)} auto`,
  },
  '@media print': {
    margin: 0,
  },
}))

export const App: React.FC = () => (
  <AppContainer>
    <LayoutContainer>
      <main>
        <MarkdownEditor />
      </main>
      <Menu />
      <SettingsModal />
    </LayoutContainer>
  </AppContainer>
)
