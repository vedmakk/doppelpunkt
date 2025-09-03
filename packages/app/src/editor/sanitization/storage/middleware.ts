import { createListenerMiddleware } from '@reduxjs/toolkit'
import { setText, setTextInternal } from '../../editorSlice'
import { storagePipeline } from './pipeline'
import { StorageContext } from '../types'

export const storageSanitizationMiddleware = createListenerMiddleware()

// Intercept setText actions to apply storage sanitization
storageSanitizationMiddleware.startListening({
  actionCreator: setText,
  effect: (action, listenerApi) => {
    const { mode, text, cursorPos } = action.payload

    const context: StorageContext = {
      originalText: text,
      originalCursorPos: cursorPos,
      mode,
    }

    const result = storagePipeline.sanitize(text, context)

    const setTextInternalAction = setTextInternal({
      mode,
      text: result.text,
      cursorPos: result.cursorPos,
    })
    // Copy metadata from the original setText action
    ;(setTextInternalAction as any).meta = (action as any)?.meta

    // Always dispatch the sanitized version using setTextInternal
    // to avoid infinite loops and ensure consistent processing
    listenerApi.dispatch(setTextInternalAction)
  },
})
