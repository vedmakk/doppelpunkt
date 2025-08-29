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
import { selectDisplayText } from './sanitization'

export const useEditorText = () => useAppSelector(selectEditorText)

export const useInjectedEditorText = (maxCharsPerLine?: number) =>
  useAppSelector((state) => selectDisplayText(state, maxCharsPerLine))

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
