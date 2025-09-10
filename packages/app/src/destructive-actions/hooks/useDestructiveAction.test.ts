import { test, expect } from 'bun:test'
import {
  DESTRUCTIVE_ACTION_CONFIGS,
  getDestructiveActionConfig,
} from '../config'
import { DestructiveActionId } from '../types'

test('destructive action configuration > all action IDs have configs', () => {
  expect(
    DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.NewDocument],
  ).toBeDefined()
  expect(
    DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.OpenDocument],
  ).toBeDefined()
  expect(
    DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.DeleteAccount],
  ).toBeDefined()
  expect(
    DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.ClearApiKey],
  ).toBeDefined()
})

test('destructive action configuration > NewDocument config has correct properties', () => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.NewDocument]

  expect(config.id).toBe(DestructiveActionId.NewDocument)
  expect(config.title).toBe('Create New Document')
  expect(config.message).toContain('Discard current content')
  expect(config.confirmLabel).toBe('Create New')
  expect(config.cancelLabel).toBe('Cancel')
})

test('destructive action configuration > OpenDocument config has correct properties', () => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.OpenDocument]

  expect(config.id).toBe(DestructiveActionId.OpenDocument)
  expect(config.title).toBe('Open Document')
  expect(config.message).toContain('Discard current content')
  expect(config.confirmLabel).toBe('Open File')
  expect(config.cancelLabel).toBe('Cancel')
})

test('destructive action configuration > DeleteAccount config has correct properties', () => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.DeleteAccount]

  expect(config.id).toBe(DestructiveActionId.DeleteAccount)
  expect(config.title).toBe('Delete Account')
  expect(config.message).toContain('permanently remove all your data')
  expect(config.confirmLabel).toBe('Delete Account')
  expect(config.cancelLabel).toBe('Cancel')
})

test('destructive action configuration > ClearApiKey config has correct properties', () => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[DestructiveActionId.ClearApiKey]

  expect(config.id).toBe(DestructiveActionId.ClearApiKey)
  expect(config.title).toBe('Clear API Key')
  expect(config.message).toContain('clear your OpenAI API key')
  expect(config.confirmLabel).toBe('Clear Key')
  expect(config.cancelLabel).toBe('Cancel')
})

test('destructive action configuration > getDestructiveActionConfig returns correct config', () => {
  const config = getDestructiveActionConfig(DestructiveActionId.NewDocument)
  expect(config.id).toBe(DestructiveActionId.NewDocument)
  expect(config.title).toBe('Create New Document')
})

test('destructive action configuration > getDestructiveActionConfig throws for invalid ID', () => {
  expect(() => {
    getDestructiveActionConfig('invalid' as DestructiveActionId)
  }).toThrow('Destructive action config invalid not found')
})
