import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
  clear,
  load,
  undo,
  redo,
  toggleAutoSave,
} from '../../editor/editorSlice'

import {
  useEditorText,
  useFutureLength,
  usePastLength,
  useAutoSaveEnabled,
  useEditorContentStats,
} from '../../editor/hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
  const content = useEditorText()
  const pastLength = usePastLength()
  const futureLength = useFutureLength()
  const autoSaveEnabled = useAutoSaveEnabled()
  const stats = useEditorContentStats()

  const dispatch = useDispatch()

  const handleNew = useCallback(() => {
    dispatch(clear())
  }, [dispatch])

  const handleOpen = useCallback(
    (text: string) => {
      if (typeof text === 'string') {
        dispatch(load(text))
      }
    },
    [dispatch],
  )

  const handleUndo = useCallback(() => dispatch(undo()), [dispatch])

  const handleRedo = useCallback(() => dispatch(redo()), [dispatch])

  const handleToggleAutoSave = useCallback(
    () => dispatch(toggleAutoSave(!autoSaveEnabled)),
    [dispatch, autoSaveEnabled],
  )

  return (
    <ToolbarComponent
      content={content}
      pastLength={pastLength}
      futureLength={futureLength}
      autoSaveEnabled={autoSaveEnabled}
      stats={stats}
      onToggleAutoSave={handleToggleAutoSave}
      onNew={handleNew}
      onOpen={handleOpen}
      onUndo={handleUndo}
      onRedo={handleRedo}
    />
  )
}

export default Toolbar
