import { useCallback } from 'react'
import { useHotkeys, useRecordHotkeys } from 'react-hotkeys-hook'

import { useAppDispatch, useAppSelector } from '../store'
import { selectHotkey } from './selectors'
import { setHotkey } from './hotkeysSlice'
import { getHotkey, HotkeyId } from './registry'

export const useHasKeyboard = () => navigator.maxTouchPoints === 0

export const useStoredHotkey = (id: string) => useAppSelector(selectHotkey(id))

type Callback = (event: KeyboardEvent) => void

export const useCustomHotkey = (id: HotkeyId, callback: Callback) => {
  const hotkey = getHotkey(id)

  const keys = useStoredHotkey(id) || hotkey.defaultKeys

  useHotkeys(keys, callback, {
    scopes: [hotkey.scope],
    enabled: useHasKeyboard(),
    enableOnFormTags: true,
  })
}

export const useCustomRecordHotkey = (id: HotkeyId | null) => {
  const [keys, { start, stop, isRecording }] = useRecordHotkeys()

  const dispatch = useAppDispatch()

  const wrappedStop = useCallback(
    (save: boolean) => {
      if (save && id && keys.size > 0) {
        dispatch(setHotkey({ id, keys: Array.from(keys).join('+') }))
      }
      stop()
    },
    [dispatch, id, keys, stop],
  )

  return [keys, { start, stop: wrappedStop, isRecording }] as const
}
