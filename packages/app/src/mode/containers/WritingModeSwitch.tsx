import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { setMode, WritingMode } from '../modeSlice'
import { useWritingMode } from '../hooks'

import { HotkeyId } from '../../hotkeys/registry'
import { useCustomHotkey } from '../../hotkeys/hooks'

import WritingModeSwitchComponent from '../components/WritingModeSwitch'

const WritingModeSwitch: React.FC = () => {
  const mode = useWritingMode()
  const dispatch = useDispatch()

  const handleSelect = useCallback(
    (m: WritingMode) => {
      dispatch(setMode(m))
    },
    [dispatch],
  )

  const handleEditorMode = useCallback(() => {
    dispatch(setMode('editor'))
  }, [dispatch])

  const handleTodoMode = useCallback(() => {
    dispatch(setMode('todo'))
  }, [dispatch])

  useCustomHotkey(HotkeyId.EditorMode, handleEditorMode)
  useCustomHotkey(HotkeyId.TodoMode, handleTodoMode)

  return <WritingModeSwitchComponent mode={mode} onSelect={handleSelect} />
}

export default WritingModeSwitch
