import { useAppSelector } from '../store'

import { selectEditorText } from './selectors'

import { tutorial, TUTORIAL_PLACEHOLDER } from './tutorial'

export const useEditorText = () => {
  const text = useAppSelector(selectEditorText)

  if (text === TUTORIAL_PLACEHOLDER) {
    return tutorial
  }

  return text
}
