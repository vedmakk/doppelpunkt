import { useAppSelector } from '../store'

import {
  selectEditorText,
  selectFutureLength,
  selectPastLength,
  selectAutoSaveEnabled,
} from './selectors'

import { tutorial, TUTORIAL_PLACEHOLDER } from './tutorial'

export const useEditorText = () => {
  const text = useAppSelector(selectEditorText)

  if (text === TUTORIAL_PLACEHOLDER) {
    return tutorial
  }

  return text
}

export const usePastLength = () => useAppSelector(selectPastLength)

export const useFutureLength = () => useAppSelector(selectFutureLength)

export const useAutoSaveEnabled = () => useAppSelector(selectAutoSaveEnabled)
