import React, { FC, ReactNode, useEffect } from 'react'
import { ThemeProvider } from '@emotion/react'
import { Provider as ReduxProvider } from 'react-redux'
import { useLadleContext } from '@ladle/react'

import { createStore, useAppDispatch } from '../store'

import { setTheme } from '../theme/themeSlice'
import { useCustomTheme } from '../theme/hooks'
import { GlobalStyles } from '../theme/components/GlobalStyles'

export const CommonStoryDecorator = (Component: FC) => (
  <ReduxProvider store={createStore()}>
    <ThemeAwareDecorator>
      <Component />
    </ThemeAwareDecorator>
  </ReduxProvider>
)

interface Props {
  readonly children: ReactNode
}

const ThemeAwareDecorator = ({ children }: Props) => {
  const { globalState } = useLadleContext()
  const { theme: ladleTheme } = globalState

  const emotionTheme = useCustomTheme()

  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setTheme(ladleTheme === 'dark' ? 'dark' : 'light'))
  }, [ladleTheme, dispatch])

  return (
    <ThemeProvider theme={emotionTheme}>
      <GlobalStyles />
      {children}
    </ThemeProvider>
  )
}
