import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { HotkeysProvider } from 'react-hotkeys-hook'

import 'prismjs/themes/prism.css'

import { store } from './store'

import { HotkeyScope } from './hotkeys/registry'

import { App } from './app/containers/App'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HotkeysProvider
        initiallyActiveScopes={[HotkeyScope.Global, HotkeyScope.Editor]}
      >
        <App />
      </HotkeysProvider>
    </Provider>
  </React.StrictMode>,
)
