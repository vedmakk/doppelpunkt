import { readingTime } from 'reading-time-estimator'

import { EditorStats } from '../shared/types'

import { useAppSelector } from '../store'

import {
  selectEditorText,
  selectAutoSaveEnabled,
  selectCaptureTab,
  selectEditorCursorPos,
} from './selectors'

import { tutorialEditor, tutorialTodo, TUTORIAL_PLACEHOLDER } from './tutorial'
import { useWritingMode } from '../mode/hooks'

export const useEditorText = () => {
  const mode = useWritingMode()
  const text = useAppSelector(selectEditorText)

  if (text === TUTORIAL_PLACEHOLDER) {
    return mode === 'editor' ? tutorialEditor : tutorialTodo
  }

  return text
}

export const useEditorCursorPos = () => {
  const mode = useWritingMode()
  const { text, cursorPos } = useAppSelector(selectEditorCursorPos)

  if (cursorPos === 0 && text === TUTORIAL_PLACEHOLDER) {
    const t = mode === 'editor' ? tutorialEditor : tutorialTodo
    return t.length
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
