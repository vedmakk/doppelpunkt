import React from 'react'
import styled from '@emotion/styled'

import Toolbar from '../../editor/containers/Toolbar'
import MarkdownEditor from '../../editor/containers/MarkdownEditor'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

export const App: React.FC = () => (
  <AppContainer>
    <Toolbar />
    <MarkdownEditor />
  </AppContainer>
)
