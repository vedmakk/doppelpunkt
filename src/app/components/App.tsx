import React from 'react'
import styled from '@emotion/styled'
import Toolbar from '../../editor/components/Toolbar'
import MarkdownEditor from '../../editor/components/MarkdownEditor'

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
