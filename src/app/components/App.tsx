import React from 'react'
import styled from '@emotion/styled'

import Menu from '../../menu/containers/Menu'
import MarkdownEditor from '../../editor/containers/MarkdownEditor'

const AppContainer = styled.main({
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

const MenuContainer = styled.nav(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: theme.layout.toolbarWidth,
  height: '100%',
  [theme.breakpoints.toolbar]: {
    left: 'unset',
    top: 0,
    right: `-${theme.layout.toolbarWidth}`,
    width: theme.layout.toolbarWidth,
    height: 'unset',
  },
  '@media print': {
    display: 'none',
  },
}))

export const App: React.FC = () => (
  <AppContainer>
    <LayoutContainer>
      <MarkdownEditor />
      <MenuContainer aria-label="Main menu">
        <Menu />
      </MenuContainer>
    </LayoutContainer>
  </AppContainer>
)
