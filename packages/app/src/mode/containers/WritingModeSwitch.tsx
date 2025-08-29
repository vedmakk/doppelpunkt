import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { setMode, WritingMode } from '../modeSlice'
import { useWritingMode } from '../hooks'
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

  return <WritingModeSwitchComponent mode={mode} onSelect={handleSelect} />
}

export default WritingModeSwitch
