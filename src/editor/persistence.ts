import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

import {
  type EditorState,
  clear,
  load,
  setText,
  toggleAutoSave,
} from './editorSlice'
import { TUTORIAL_PLACEHOLDER } from './tutorial'

const EDITOR_KEY = 'editor'
const MARKDOWN_KEY = `${EDITOR_KEY}.markdown`
const AUTO_SAVE_KEY = `${EDITOR_KEY}.autoSave`

export const editorStorageKeys = {
  MARKDOWN_KEY,
  AUTO_SAVE_KEY,
}

export function hydrateEditorStateFromStorage(): { editor: EditorState } {
  try {
    const storedText = localStorage.getItem(MARKDOWN_KEY)
    const storedAutoSave = localStorage.getItem(AUTO_SAVE_KEY)

    const text = storedText || TUTORIAL_PLACEHOLDER
    const autoSave = storedAutoSave === 'true'

    const editor: EditorState = {
      text,
      cursorPos: text === TUTORIAL_PLACEHOLDER ? 0 : text.length,
      autoSave,
      captureTab: true,
    }

    return { editor }
  } catch {
    // In non-browser or restricted environments, fall back to defaults
    const editor: EditorState = {
      text: TUTORIAL_PLACEHOLDER,
      cursorPos: 0,
      autoSave: false,
      captureTab: true,
    }
    return { editor }
  }
}

export const editorListenerMiddleware = createListenerMiddleware()

editorListenerMiddleware.startListening({
  matcher: isAnyOf(setText, clear, load, toggleAutoSave),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as { editor: EditorState }
    try {
      if (state.editor.autoSave) {
        localStorage.setItem(AUTO_SAVE_KEY, 'true')
        localStorage.setItem(MARKDOWN_KEY, state.editor.text)
      } else {
        localStorage.removeItem(AUTO_SAVE_KEY)
        localStorage.removeItem(MARKDOWN_KEY)
      }
    } catch {
      // Ignore storage failures
    }
  },
})
