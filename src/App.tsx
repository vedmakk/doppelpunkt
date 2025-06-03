import React from 'react'
import styled from '@emotion/styled'
import Toolbar from './components/Toolbar'
import MarkdownEditor from './components/MarkdownEditor'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const App: React.FC = () => (
  <AppContainer>
    <Toolbar />
    <MarkdownEditor />
  </AppContainer>
)

export default App
