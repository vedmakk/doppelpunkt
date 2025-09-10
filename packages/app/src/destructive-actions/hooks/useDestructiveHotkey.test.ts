import { test, expect } from 'bun:test'
import { getHotkey } from '../../hotkeys/registry'
import { HotkeyId } from '../../hotkeys/registry'
import { DestructiveActionId } from '../types'

test('hotkey registry > destructive hotkeys are marked correctly', () => {
  const newDocHotkey = getHotkey(HotkeyId.NewDocument)
  const openDocHotkey = getHotkey(HotkeyId.OpenDocument)
  const toggleTabHotkey = getHotkey(HotkeyId.ToggleCaptureTab)
  const toggleMenuHotkey = getHotkey(HotkeyId.ToggleMenu)

  // Destructive hotkeys should have destructive property set
  expect(newDocHotkey.destructive).toBe(DestructiveActionId.NewDocument)
  expect(openDocHotkey.destructive).toBe(DestructiveActionId.OpenDocument)

  // Non-destructive hotkeys should have destructive property set to false
  expect(toggleTabHotkey.destructive).toBe(false)
  expect(toggleMenuHotkey.destructive).toBe(false)
})

test('hotkey registry > getHotkey returns correct hotkey definitions', () => {
  const newDocHotkey = getHotkey(HotkeyId.NewDocument)

  expect(newDocHotkey.id).toBe(HotkeyId.NewDocument)
  expect(newDocHotkey.label).toBe('New Document')
  expect(newDocHotkey.description).toBe('Create a new document.')
  expect(newDocHotkey.defaultKeys).toBe('ctrl+shift+n')
  expect(newDocHotkey.destructive).toBe(DestructiveActionId.NewDocument)
})

test('hotkey registry > getHotkey throws for invalid hotkey ID', () => {
  expect(() => {
    getHotkey('invalid' as HotkeyId)
  }).toThrow('Hotkey invalid not found')
})

test('hotkey registry > destructive hotkeys map to correct action IDs', () => {
  const newDocHotkey = getHotkey(HotkeyId.NewDocument)
  const openDocHotkey = getHotkey(HotkeyId.OpenDocument)

  expect(newDocHotkey.destructive).toBe(DestructiveActionId.NewDocument)
  expect(openDocHotkey.destructive).toBe(DestructiveActionId.OpenDocument)
})

test('hotkey registry > non-destructive hotkeys are properly marked', () => {
  const toggleTabHotkey = getHotkey(HotkeyId.ToggleCaptureTab)
  const toggleMenuHotkey = getHotkey(HotkeyId.ToggleMenu)

  expect(toggleTabHotkey.destructive).toBe(false)
  expect(toggleMenuHotkey.destructive).toBe(false)
})
