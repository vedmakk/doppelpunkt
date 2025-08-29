import React from 'react'

import { Button } from '../app/components/Button'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/Button',
  decorators: [CommonStoryDecorator],
}

export const Default = () => {
  return (
    <Button
      label="Default Button"
      onClick={() => console.log('Default Button clicked')}
      disabled={false}
      active={false}
      externalLink={false}
    />
  )
}

export const Disabled = () => {
  return (
    <Button
      label="Disabled Button"
      onClick={() => console.log('Disabled Button clicked')}
      disabled={true}
      active={false}
      externalLink={false}
    />
  )
}

export const Active = () => {
  return (
    <Button
      label="Active Button"
      onClick={() => console.log('Active Button clicked')}
      disabled={false}
      active={true}
      externalLink={false}
    />
  )
}

export const ExternalLink = () => {
  return (
    <Button
      label="External Link Button"
      disabled={false}
      active={false}
      externalLink={true}
      href="https://www.google.com"
    />
  )
}
