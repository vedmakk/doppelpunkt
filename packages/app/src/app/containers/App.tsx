import React, { useEffect } from 'react'
import { ThemeProvider } from '@emotion/react'

import { useCustomTheme } from '../../theme/hooks'
import { useAppDispatch } from '../../store'
import { appInitialized } from '../../cloudsync/cloudSlice'

import { GlobalStyles } from '../../theme/components/GlobalStyles'
import { PrintStyles } from '../../theme/components/PrintStyles'
import { useThemeTracker } from '../../theme/useThemeTracker'

import { App as AppComponent } from '../components/App'

export const App = () => {
  const theme = useCustomTheme()
  const dispatch = useAppDispatch()

  useThemeTracker()

  // Dispatch app initialization on mount
  useEffect(() => {
    dispatch(appInitialized())
  }, [dispatch])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <PrintStyles />
      <AppComponent />
    </ThemeProvider>
  )
}
