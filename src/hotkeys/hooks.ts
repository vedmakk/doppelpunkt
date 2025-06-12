import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { selectHotkey } from './selectors'
import { setHotkey } from './hotkeysSlice'

const hasKeyboard = () => navigator.maxTouchPoints === 0

const parseKeys = (keys: string) => keys.toLowerCase().split('+')

export const useStoredHotkey = (id: string) => useAppSelector(selectHotkey(id))

type Callback = (event: KeyboardEvent) => void

export const useHotkey = (
  id: string,
  defaultKeys: string,
  callback: Callback,
) => {
  const keys = useStoredHotkey(id) || defaultKeys

  useEffect(() => {
    if (!hasKeyboard()) return
    const handler = (e: KeyboardEvent) => {
      const parts = parseKeys(keys)
      const mod = parts.includes('ctrl') || parts.includes('mod')
      const shift = parts.includes('shift')
      const key = parts[parts.length - 1]
      if (
        !!mod === (e.ctrlKey || e.metaKey) &&
        !!shift === e.shiftKey &&
        e.key.toLowerCase() === key
      ) {
        e.preventDefault()
        callback(e)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keys, callback])
}

export const useRecordHotkey = (id: string | null) => {
  const dispatch = useAppDispatch()
  const [keys, setKeys] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const start = useCallback(() => {
    if (!id) return
    setKeys([])
    setIsRecording(true)
  }, [id])

  const stop = useCallback(
    (save: boolean) => {
      if (save && id && keys.length) {
        dispatch(setHotkey({ id, keys: keys.join('+') }))
      }
      setIsRecording(false)
    },
    [dispatch, id, keys],
  )

  const handleKey = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    const parts = [
      e.ctrlKey || e.metaKey ? 'ctrl' : null,
      e.shiftKey ? 'shift' : null,
      e.key.toLowerCase(),
    ].filter(Boolean) as string[]
    setKeys(parts)
  }, [])

  useEffect(() => {
    if (!isRecording || !id || !hasKeyboard()) return
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isRecording, id, handleKey])

  return [keys, { start, stop, isRecording }] as const
}
