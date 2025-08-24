import React, { useCallback } from 'react'

import { HotkeysInfo as HotkeysInfoComponent } from '../components/HotkeysInfo'
import { useCustomRecordHotkey, useEditingHotkeyId } from '../hooks'
import { useAppDispatch } from '../../store'
import { HotkeyId } from '../registry'
import { setEditingHotkeyId } from '../hotkeysSlice'

export const HotkeysInfo = () => {
  const editingHotkeyId = useEditingHotkeyId()
  const [keys, { start, save, cancel, setDefaultKeys, isRecording }] =
    useCustomRecordHotkey(editingHotkeyId)

  const dispatch = useAppDispatch()

  const handleStartEditHotkey = useCallback(
    (id: HotkeyId) => {
      dispatch(setEditingHotkeyId(id))
      start()
    },
    [dispatch, start],
  )

  return (
    <HotkeysInfoComponent
      isEditing={isRecording}
      editHotkeyId={editingHotkeyId}
      editHotkeyKeys={Array.from(keys).join('+')}
      onStartEditHotkey={handleStartEditHotkey}
      onCancelEditHotkey={cancel}
      onSaveEditHotkey={save}
      onSetDefaultKeys={setDefaultKeys}
    />
  )
}
