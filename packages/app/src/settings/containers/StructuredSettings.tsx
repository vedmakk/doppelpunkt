import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import StructuredSettingsComponent from '../components/StructuredSettings'
import { useAppSelector } from '../../store'
import {
  setStructuredApiKey,
  setStructuredEnabled,
  requestSaveStructuredConfig,
} from '../../structured/structuredSlice'

const StructuredSettings: React.FC = () => {
  const enabled = useAppSelector((s) => s.structured.enabled)
  const apiKey = useAppSelector((s) => s.structured.apiKey)
  const dispatch = useDispatch()

  const onToggleEnabled = useCallback(
    () => dispatch(setStructuredEnabled(!enabled)),
    [dispatch, enabled],
  )

  const onChangeApiKey = useCallback(
    (value: string) => dispatch(setStructuredApiKey(value || null)),
    [dispatch],
  )

  const onSave = useCallback(
    () => dispatch(requestSaveStructuredConfig()),
    [dispatch],
  )

  return (
    <StructuredSettingsComponent
      enabled={enabled}
      apiKey={apiKey}
      onToggleEnabled={onToggleEnabled}
      onChangeApiKey={onChangeApiKey}
      onSave={onSave}
    />
  )
}

export default StructuredSettings
