import { readingTime } from 'reading-time-estimator'

import { EditorStats } from '../shared/types'

import { useAppSelector } from '../store'

import {
  selectEditorText,
  selectAutoSaveEnabled,
  selectCaptureTab,
  selectEditorCursorPos,
} from './selectors'

import { tutorial, TUTORIAL_PLACEHOLDER } from './tutorial'

export const useEditorText = () => {
  const text = useAppSelector(selectEditorText)

  if (text === TUTORIAL_PLACEHOLDER) {
    return tutorial
  }

  return text
}

export const useEditorCursorPos = () => {
  const { text, cursorPos } = useAppSelector(selectEditorCursorPos)

  if (cursorPos === 0 && text === TUTORIAL_PLACEHOLDER) {
    return tutorial.length
  }

  return cursorPos
}

export const useAutoSaveEnabled = () => useAppSelector(selectAutoSaveEnabled)

export const useCaptureTabEnabled = () => useAppSelector(selectCaptureTab)

export const useEditorContentStats = (): EditorStats => {
  const text = useEditorText()

  const rt = readingTime(text, 250)

  const stats: EditorStats = {
    readingTime: rt.text,
    wordCount: rt.words,
    characterCount: text.length,
  }

  return stats
}
