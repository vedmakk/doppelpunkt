import React, { useState } from 'react'

import Switch from '../app/components/Switch'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/Switch',
  decorators: [CommonStoryDecorator],
}

export const Default = () => {
  const [checked, setChecked] = useState(false)
  return (
    <Switch
      label="Default Switch"
      checked={checked}
      onChange={setChecked}
      size={32}
    />
  )
}

export const Checked = () => {
  const [checked, setChecked] = useState(true)
  return (
    <Switch
      label="Checked Switch"
      checked={checked}
      onChange={setChecked}
      size={32}
    />
  )
}

export const SmallSize = () => {
  const [checked, setChecked] = useState(false)
  return (
    <Switch
      label="Small Switch"
      checked={checked}
      onChange={setChecked}
      size={24}
    />
  )
}

export const LargeSize = () => {
  const [checked, setChecked] = useState(false)
  return (
    <Switch
      label="Large Switch"
      checked={checked}
      onChange={setChecked}
      size={48}
    />
  )
}

export const NoLabel = () => {
  const [checked, setChecked] = useState(false)
  return <Switch label="" checked={checked} onChange={setChecked} size={32} />
}

export const Interactive = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [autoSave, setAutoSave] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Switch
        label="Dark Mode"
        checked={darkMode}
        onChange={setDarkMode}
        size={32}
      />
      <Switch
        label="Enable Notifications"
        checked={notifications}
        onChange={setNotifications}
        size={32}
      />
      <Switch
        label="Auto Save"
        checked={autoSave}
        onChange={setAutoSave}
        size={32}
      />
    </div>
  )
}

export const Disabled = () => {
  const [checked, setChecked] = useState(false)
  return (
    <Switch
      label="Disabled Switch"
      checked={checked}
      onChange={setChecked}
      size={32}
      disabled={true}
    />
  )
}

export const DisabledChecked = () => {
  const [checked, setChecked] = useState(true)
  return (
    <Switch
      label="Disabled Checked Switch"
      checked={checked}
      onChange={setChecked}
      size={32}
      disabled={true}
    />
  )
}
