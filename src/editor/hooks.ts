import { readingTime } from 'reading-time-estimator'

import { EditorStats } from '../shared/types'

import { useAppSelector } from '../store'

import { selectEditorText, selectAutoSaveEnabled } from './selectors'

import { tutorial, TUTORIAL_PLACEHOLDER } from './tutorial'

export const useEditorText = () => {
  const text = useAppSelector(selectEditorText)

  if (text === TUTORIAL_PLACEHOLDER) {
    return tutorial
  }

  return text
}

export const useAutoSaveEnabled = () => useAppSelector(selectAutoSaveEnabled)

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
