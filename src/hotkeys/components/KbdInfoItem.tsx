import React, { useState } from 'react'

import { useCustomRecordHotkey, useStoredHotkey } from '../hooks'

import { HotkeyDefinition } from '../registry'

import { Label } from '../../app/components/Label'
import { Button } from '../../app/components/Button'
import KbdShortcut from './KbdShortcut'

interface Props {
  hotkey: HotkeyDefinition
}

const KbdInfoItem = ({ hotkey }: Props) => {
  const [editing, setEditing] = useState(false)

  const stored = useStoredHotkey(hotkey.id)
  const [keys, { start, stop, isRecording }] = useCustomRecordHotkey(
    editing ? hotkey.id : null,
  )

  const handleCancel = () => {
    stop(false)
    setEditing(false)
  }

  const handleSave = () => {
    stop(true)
    setEditing(false)
  }

  return (
    <Label size="tiny">
      {editing ? (
        isRecording ? (
          <>
            {keys.size > 0 ? (
              <KbdShortcut hotkeys={Array.from(keys).join(' + ')} />
            ) : (
              <span>Press keys…</span>
            )}{' '}
            <Button label="save" onClick={handleSave} />{' '}
            <Button label="cancel" onClick={handleCancel} />
          </>
        ) : (
          <Button label="record" onClick={start} />
        )
      ) : (
        <>
          <KbdShortcut hotkeys={stored || hotkey.defaultKeys} />{' '}
          {hotkey.description}{' '}
          <Button label="edit" onClick={() => setEditing(true)} />
        </>
      )}
    </Label>
  )
}

export default KbdInfoItem
