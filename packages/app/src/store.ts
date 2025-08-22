import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'

import { editorReducer } from './editor/editorSlice'
import {
  editorListenerMiddleware,
  hydrateAppStateFromStorage,
} from './editor/persistenceMiddleware'
import { cloudReducer } from './cloudsync/cloudSlice'
import {
  cloudListenerMiddleware,
  hydrateCloudStateFromStorage,
} from './cloudsync/cloudPersistenceMiddleware'
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
      cloud: cloudReducer,
      mode: modeReducer,
      menu: menuReducer,
      hotkeys: hotkeysReducer,
      settings: settingsReducer,
    },
    preloadedState: {
      ...hydrateAppStateFromStorage(),
      ...hydrateCloudStateFromStorage(),
    },
    middleware: (getDefaultMiddleware) => {
      const defaults = getDefaultMiddleware()
      return defaults
        .prepend(cloudListenerMiddleware.middleware)
        .prepend(editorListenerMiddleware.middleware)
    },
  })

export const store = createStore()

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector<RootState, T>(selector)
