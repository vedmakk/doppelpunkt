import React, { useCallback } from 'react'

import { useCustomRecordHotkey, useStoredHotkey } from '../hooks'

import { HotkeyDefinition } from '../registry'

import { Label } from '../../app/components/Label'
import { Button } from '../../app/components/Button'
import KbdShortcut from './KbdShortcut'

interface Props {
  hotkey: HotkeyDefinition
}

const KbdInfoItem = ({ hotkey }: Props) => {
  const stored = useStoredHotkey(hotkey.id)
  const [keys, { start, stop, setDefaultKeys, isRecording }] =
    useCustomRecordHotkey(hotkey.id)

  const handleEdit = useCallback(() => {
    start()
  }, [start])

  const handleCancel = useCallback(() => {
    stop(false)
  }, [stop])

  const handleSave = useCallback(() => {
    stop(true)
  }, [stop])

  return (
    <Label size="tiny">
      {isRecording ? (
        <>
          {keys.size > 0 ? (
            <KbdShortcut hotkeys={Array.from(keys).join(' + ')} />
          ) : (
            <span>Press keys…</span>
          )}{' '}
          <Button label="save" onClick={handleSave} />{' '}
          <Button label="default" onClick={setDefaultKeys} />{' '}
          <Button label="cancel" onClick={handleCancel} />
        </>
      ) : (
        <>
          <KbdShortcut hotkeys={stored || hotkey.defaultKeys} />{' '}
          {hotkey.description} <Button label="edit" onClick={handleEdit} />
        </>
      )}
    </Label>
  )
}

export default KbdInfoItem
