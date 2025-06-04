import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
  clear,
  load,
  undo,
  redo,
  toggleAutoSave,
} from '../../editor/editorSlice'
import { toggleMenu, closeMenu, setShouldRender } from '../menuSlice'
import {
  useEditorText,
  useFutureLength,
  usePastLength,
  useAutoSaveEnabled,
} from '../../editor/hooks'
import { useIsMenuOpen, useShouldRenderMenu } from '../hooks'

import ToolbarComponent from '../components/Toolbar'

const Toolbar: React.FC = () => {
  const content = useEditorText()
  const pastLength = usePastLength()
  const futureLength = useFutureLength()
  const autoSaveEnabled = useAutoSaveEnabled()

  const isMenuOpen = useIsMenuOpen()
  const shouldRenderMenu = useShouldRenderMenu()

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

  const handleToggleMenu = useCallback(() => {
    dispatch(toggleMenu())
  }, [dispatch])

  const setShouldRenderMenu = useCallback(
    (shouldRender: boolean) => {
      dispatch(setShouldRender(shouldRender))
    },
    [dispatch],
  )

  const handleCloseMenu = useCallback(() => {
    dispatch(closeMenu())
  }, [dispatch])

  return (
    <ToolbarComponent
      content={content}
      pastLength={pastLength}
      futureLength={futureLength}
      autoSaveEnabled={autoSaveEnabled}
      onToggleAutoSave={handleToggleAutoSave}
      onNew={handleNew}
      onOpen={handleOpen}
      onUndo={handleUndo}
      onRedo={handleRedo}
      isOpen={isMenuOpen}
      shouldRender={shouldRenderMenu}
      toggleMenu={handleToggleMenu}
      closeMenu={handleCloseMenu}
      setShouldRender={setShouldRenderMenu}
    />
  )
}

export default Toolbar
