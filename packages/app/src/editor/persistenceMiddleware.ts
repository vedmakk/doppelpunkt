import { createListenerMiddleware } from '@reduxjs/toolkit'

import { type EditorState } from './editorSlice'
import { TUTORIAL_PLACEHOLDER } from './tutorial'
import { safeLocalStorage } from '../shared/storage'

const EDITOR_KEY = 'editor'
const MARKDOWN_KEY_EDITOR = `${EDITOR_KEY}.markdown.editor`
const MARKDOWN_KEY_TODO = `${EDITOR_KEY}.markdown.todo`
const AUTO_SAVE_KEY = `${EDITOR_KEY}.autoSave`

export const editorStorageKeys = {
  MARKDOWN_KEY_EDITOR,
  MARKDOWN_KEY_TODO,
  AUTO_SAVE_KEY,
}

export function hydrateAppStateFromStorage(): { editor: EditorState } {
  try {
    const storedTextEditor = safeLocalStorage.getItem(MARKDOWN_KEY_EDITOR)
    const storedTextTodo = safeLocalStorage.getItem(MARKDOWN_KEY_TODO)
    const storedAutoSave = safeLocalStorage.getItem(AUTO_SAVE_KEY)

    const textEditor = storedTextEditor ?? TUTORIAL_PLACEHOLDER
    const textTodo = storedTextTodo ?? TUTORIAL_PLACEHOLDER
    const autoSave = storedAutoSave === 'true'

    const editor: EditorState = {
      documents: {
        editor: {
          text: textEditor,
          cursorPos:
            textEditor === TUTORIAL_PLACEHOLDER ? 0 : textEditor.length,
        },
        todo: {
          text: textTodo,
          cursorPos: textTodo === TUTORIAL_PLACEHOLDER ? 0 : textTodo.length,
        },
      },
      autoSave,
      captureTab: true,
    }

    return { editor }
  } catch {
    // In non-browser or restricted environments, fall back to defaults
    const editor: EditorState = {
      documents: {
        editor: { text: TUTORIAL_PLACEHOLDER, cursorPos: 0 },
        todo: { text: TUTORIAL_PLACEHOLDER, cursorPos: 0 },
      },
      autoSave: false,
      captureTab: true,
    }
    return { editor }
  }
}

export const editorListenerMiddleware = createListenerMiddleware()

editorListenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    // Only trigger when the relevant editor state actually changes
    const current = currentState as { editor: EditorState }
    const previous = previousState as { editor: EditorState } | undefined

    if (!previous) return true // Initial state

    return (
      current.editor.autoSave !== previous.editor.autoSave ||
      current.editor.documents.editor.text !==
        previous.editor.documents.editor.text ||
      current.editor.documents.todo.text !== previous.editor.documents.todo.text
    )
  },
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as { editor: EditorState }
    try {
      if (state.editor.autoSave) {
        safeLocalStorage.setItem(AUTO_SAVE_KEY, 'true')
        safeLocalStorage.setItem(
          MARKDOWN_KEY_EDITOR,
          state.editor.documents.editor.text,
        )
        safeLocalStorage.setItem(
          MARKDOWN_KEY_TODO,
          state.editor.documents.todo.text,
        )
      } else {
        safeLocalStorage.removeItem(AUTO_SAVE_KEY)
        safeLocalStorage.removeItem(MARKDOWN_KEY_EDITOR)
        safeLocalStorage.removeItem(MARKDOWN_KEY_TODO)
      }
    } catch {
      // Ignore storage failures
    }
  },
})
