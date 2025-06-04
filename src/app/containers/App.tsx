import React from 'react'
import { ThemeProvider } from '@emotion/react'

import { useCustomTheme } from '../../theme/hooks'

import { App as AppComponent } from '../components/App'
import { GlobalStyles } from '../../theme/components/GlobalStyles'
import { PrintStyles } from '../../theme/components/PrintStyles'

export const App = () => {
  const theme = useCustomTheme()

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <PrintStyles />
      <AppComponent />
    </ThemeProvider>
  )
}
