import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { HotkeysProvider } from 'react-hotkeys-hook'
import debug from 'debug'

import 'prismjs/themes/prism.css'

import { store } from './store'

import { HotkeyScope } from './hotkeys/registry'

import { App } from './app/containers/App'

if (import.meta.env.DEV) {
  debug.enable('*')
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HotkeysProvider
        initiallyActiveScopes={[
          HotkeyScope.Global,
          HotkeyScope.Editor,
          HotkeyScope.EditorUnfocused,
        ]}
      >
        <App />
      </HotkeysProvider>
    </Provider>
  </React.StrictMode>,
)
