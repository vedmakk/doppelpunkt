import { useCallback } from 'react'
import { useHotkeys, useRecordHotkeys } from 'react-hotkeys-hook'

import { useAppDispatch, useAppSelector } from '../store'
import { setHotkey, setDefaultHotkey } from './hotkeysSlice'
import { selectEditingHotkeyId, selectHotkey } from './selectors'

import { getHotkey, HotkeyId } from './registry'

export const useHasKeyboard = () => navigator.maxTouchPoints === 0

export const useStoredHotkey = (id: string) => useAppSelector(selectHotkey(id))

export const useEditingHotkeyId = () => useAppSelector(selectEditingHotkeyId)

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

export const useCustomRecordHotkey = (id?: HotkeyId) => {
  const [keys, { start, stop, isRecording }] = useRecordHotkeys()

  const dispatch = useAppDispatch()

  const save = useCallback(() => {
    if (id && keys.size > 0) {
      dispatch(setHotkey({ id, keys: Array.from(keys).join('+') }))
    }
    stop()
  }, [dispatch, id, keys, stop])

  const cancel = useCallback(() => {
    stop()
  }, [stop])

  const setDefaultKeys = useCallback(() => {
    if (id) {
      dispatch(setDefaultHotkey({ id }))
      stop()
    }
  }, [dispatch, stop, id])

  return [keys, { start, save, cancel, setDefaultKeys, isRecording }] as const
}
