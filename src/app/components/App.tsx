import React from 'react'
import styled from '@emotion/styled'

import Menu from '../../menu/containers/Menu'
import MarkdownEditor from '../../editor/containers/MarkdownEditor'

const AppContainer = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  minHeight: '100vh',
  background: theme.colors.backdrop,
}))

const LayoutContainer = styled.div(({ theme }) => ({
  margin: 0,
  width: '100%',
  position: 'relative',
  [theme.breakpoints.page]: {
    width: 'fit-content',
    margin: `${theme.spacing(4)} auto`,
  },
  '@media print': {
    margin: 0,
  },
}))

const MenuContainer = styled.div(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  width: theme.layout.toolbarWidth,
  padding: `${theme.spacing(2)}`,
  [theme.breakpoints.toolbar]: {
    right: `-${theme.layout.toolbarWidth}`,
    width: theme.layout.toolbarWidth,
    padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
  },
  '@media print': {
    display: 'none',
  },
}))

export const App: React.FC = () => (
  <AppContainer>
    <LayoutContainer>
      <MarkdownEditor />
      <MenuContainer>
        <Menu />
      </MenuContainer>
    </LayoutContainer>
  </AppContainer>
)
