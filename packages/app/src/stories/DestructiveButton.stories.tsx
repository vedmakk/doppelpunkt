import React from 'react'
import { DestructiveButton, DestructiveActionId } from '../destructive-actions'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/DestructiveButton',
  decorators: [CommonStoryDecorator],
}

export const Default = () => (
  <DestructiveButton
    label="Delete Account"
    configId={DestructiveActionId.DeleteAccount}
    onClick={() => console.log('Account deleted')}
  />
)

export const CustomLabels = () => (
  <DestructiveButton
    label="Clear API Key"
    configId={DestructiveActionId.ClearApiKey}
    onClick={() => console.log('API key cleared')}
  />
)

export const ConditionalConfirmation = () => {
  const [hasContent, setHasContent] = React.useState(true)

  return (
    <div>
      <p>Current state: {hasContent ? 'Has content' : 'No content'}</p>
      <button onClick={() => setHasContent(!hasContent)}>
        Toggle content state
      </button>
      <br />
      <br />
      <DestructiveButton
        label="New Document"
        configId={DestructiveActionId.NewDocument}
        onClick={() => {
          console.log('New document created')
          setHasContent(false)
        }}
        requiresCondition={() => hasContent}
      />
    </div>
  )
}

export const Disabled = () => (
  <DestructiveButton
    label="Delete Account"
    configId={DestructiveActionId.DeleteAccount}
    onClick={() => console.log('Account deleted')}
    disabled={true}
  />
)

export const Active = () => (
  <DestructiveButton
    label="Open Document"
    configId={DestructiveActionId.OpenDocument}
    onClick={() => console.log('Document opened')}
    active={true}
  />
)

export const LongMessage = () => (
  <DestructiveButton
    label="Delete Account"
    configId={DestructiveActionId.DeleteAccount}
    onClick={() => console.log('Account deleted')}
  />
)

// New config-based examples
export const NewDocumentConfig = () => {
  const [hasContent, setHasContent] = React.useState(true)

  return (
    <div>
      <p>Using config-based approach for New Document action</p>
      <p>Current state: {hasContent ? 'Has content' : 'No content'}</p>
      <button onClick={() => setHasContent(!hasContent)}>
        Toggle content state
      </button>
      <br />
      <br />
      <DestructiveButton
        label="New Document"
        configId={DestructiveActionId.NewDocument}
        onClick={() => {
          console.log('New document created')
          setHasContent(false)
        }}
        requiresCondition={() => hasContent}
      />
    </div>
  )
}

export const OpenDocumentConfig = () => {
  const [hasContent, setHasContent] = React.useState(true)

  return (
    <div>
      <p>Using config-based approach for Open Document action</p>
      <p>Current state: {hasContent ? 'Has content' : 'No content'}</p>
      <button onClick={() => setHasContent(!hasContent)}>
        Toggle content state
      </button>
      <br />
      <br />
      <DestructiveButton
        label="Open Document"
        configId={DestructiveActionId.OpenDocument}
        onClick={() => {
          console.log('Document opened')
          setHasContent(false)
        }}
        requiresCondition={() => hasContent}
      />
    </div>
  )
}

export const DeleteAccountConfig = () => (
  <div>
    <p>Using config-based approach for Delete Account action</p>
    <DestructiveButton
      label="Delete Account"
      configId={DestructiveActionId.DeleteAccount}
      onClick={() => console.log('Account deleted')}
    />
  </div>
)

export const ClearApiKeyConfig = () => (
  <div>
    <p>Using config-based approach for Clear API Key action</p>
    <DestructiveButton
      label="Clear API Key"
      configId={DestructiveActionId.ClearApiKey}
      onClick={() => console.log('API key cleared')}
    />
  </div>
)
