import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'

import { editorReducer } from './editor/editorSlice'
import {
  editorListenerMiddleware,
  hydrateAppStateFromStorage,
} from './editor/persistence'
import { themeReducer } from './theme/themeSlice'
import { menuReducer } from './menu/menuSlice'
import { hotkeysReducer } from './hotkeys/hotkeysSlice'
import { settingsReducer } from './settings/settingsSlice'
import { modeReducer } from './mode/modeSlice'

export const createStore = () =>
  configureStore({
    reducer: {
      theme: themeReducer,
      editor: editorReducer,
      mode: modeReducer,
      menu: menuReducer,
      hotkeys: hotkeysReducer,
      settings: settingsReducer,
    },
    preloadedState: hydrateAppStateFromStorage(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(editorListenerMiddleware.middleware),
  })

export const store = createStore()

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector<RootState, T>(selector)
