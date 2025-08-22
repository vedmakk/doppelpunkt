import React from 'react'
import styled from '@emotion/styled'

import Switch from '../../app/components/Switch'
import { Button } from '../../app/components/Button'
import { Label } from '../../app/components/Label'
import { MutedLabel } from '../../menu/components/MutedLabel'

const Row = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}))

const Col = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}))

const ApiKeyInput = styled.input(({ theme }) => ({
  width: '100%',
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: 8,
  border: `1px solid ${theme.colors.text}`,
  background: theme.colors.secondary,
  color: theme.colors.text,
}))

interface Props {
  enabled: boolean
  apiKey: string | null
  onToggleEnabled: () => void
  onChangeApiKey: (value: string) => void
  onSave: () => void
}

const StructuredSettings: React.FC<Props> = ({
  enabled,
  apiKey,
  onToggleEnabled,
  onChangeApiKey,
  onSave,
}) => {
  return (
    <div>
      <Row>
        <Col>
          <Switch
            label="Enable Structured Todos"
            checked={enabled}
            onChange={onToggleEnabled}
            size={24}
          />
          <MutedLabel size="tiny">
            When enabled, your todo document is analyzed to extract structured
            tasks.
          </MutedLabel>
        </Col>
      </Row>
      <Row>
        <Col>
          <Label size="small">OpenAI API key</Label>
          <ApiKeyInput
            type="password"
            placeholder="sk-..."
            value={apiKey ?? ''}
            onChange={(e) => onChangeApiKey(e.target.value)}
            aria-label="OpenAI API key"
          />
          <MutedLabel size="tiny">
            Your key is stored only in your private user config in Firestore and
            used by the function.
          </MutedLabel>
          <Button label="Save" onClick={onSave} />
        </Col>
      </Row>
    </div>
  )
}

export default StructuredSettings
