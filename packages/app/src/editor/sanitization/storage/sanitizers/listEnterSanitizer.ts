import {
  StorageSanitizer,
  SanitizationResult,
  StorageContext,
} from '../../types'
import {
  computeListEnter,
  ComputeListEnterOptions,
} from '../../../utils/computeListEnter'

// Extended context for list enter sanitizer that includes key event information
export interface ListEnterContext extends StorageContext {
  isEnterKey?: boolean
  shiftKey?: boolean
  selectionStart?: number
  selectionEnd?: number
}

export const listEnterSanitizer: StorageSanitizer = {
  name: 'listEnter',
  sanitize: (text: string, context: StorageContext): SanitizationResult => {
    // This sanitizer only processes when it's an Enter key event with the proper context
    const listContext = context as ListEnterContext

    if (
      !listContext.isEnterKey ||
      listContext.selectionStart === undefined ||
      listContext.selectionEnd === undefined
    ) {
      // Not a list enter scenario, return text unchanged
      return { text, cursorPos: context.originalCursorPos }
    }

    const options: ComputeListEnterOptions = {
      value: text,
      selectionStart: listContext.selectionStart,
      selectionEnd: listContext.selectionEnd,
      shiftKey: listContext.shiftKey ?? false,
    }

    const result = computeListEnter(options)

    if (!result) {
      // Not a list scenario, return unchanged
      return { text, cursorPos: context.originalCursorPos }
    }

    return {
      text: result.newValue,
      cursorPos: result.newCursor,
    }
  },
}

// Helper function to create a list enter event context
export function createListEnterContext(
  baseContext: StorageContext,
  selectionStart: number,
  selectionEnd: number,
  shiftKey: boolean = false,
): ListEnterContext {
  return {
    ...baseContext,
    isEnterKey: true,
    shiftKey,
    selectionStart,
    selectionEnd,
  }
}
