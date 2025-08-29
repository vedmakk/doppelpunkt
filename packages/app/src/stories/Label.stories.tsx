import React from 'react'

import { Label } from '../app/components/Label'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/Label',
  decorators: [CommonStoryDecorator],
}

export const Default = () => {
  return <Label>Default Label</Label>
}

export const Large = () => {
  return <Label size="large">Large Label</Label>
}

export const Normal = () => {
  return <Label size="normal">Normal Label</Label>
}

export const Small = () => {
  return <Label size="small">Small Label</Label>
}

export const Tiny = () => {
  return <Label size="tiny">Tiny Label</Label>
}

export const AsHeading = () => {
  return (
    <Label as="h2" size="large">
      Label as H2 Heading
    </Label>
  )
}

export const WithCustomClass = () => {
  return (
    <Label className="custom-class" size="normal">
      Label with Custom Class
    </Label>
  )
}
