import React from 'react'

import { MutedLabel } from '../menu/components/MutedLabel'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/MutedLabel',
  decorators: [CommonStoryDecorator],
}

export const Default = () => {
  return <MutedLabel>Default Muted Label</MutedLabel>
}

export const Large = () => {
  return <MutedLabel size="large">Large Muted Label</MutedLabel>
}

export const Normal = () => {
  return <MutedLabel size="normal">Normal Muted Label</MutedLabel>
}

export const Small = () => {
  return <MutedLabel size="small">Small Muted Label</MutedLabel>
}

export const Tiny = () => {
  return <MutedLabel size="tiny">Tiny Muted Label</MutedLabel>
}

export const AsSpan = () => {
  return (
    <MutedLabel as="span" size="small">
      Muted Label as Span
    </MutedLabel>
  )
}

export const AsParagraph = () => {
  return (
    <MutedLabel as="p" size="normal">
      Muted Label as Paragraph
    </MutedLabel>
  )
}
