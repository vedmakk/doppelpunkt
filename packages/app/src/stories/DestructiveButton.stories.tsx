import React from 'react'
import { DestructiveButton } from '../app/components/DestructiveButton'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/DestructiveButton',
  decorators: [CommonStoryDecorator],
}

export const Default = () => (
  <DestructiveButton
    label="Delete Item"
    onClick={() => console.log('Item deleted')}
    confirmationMessage="Are you sure you want to delete this item?"
  />
)

export const CustomLabels = () => (
  <DestructiveButton
    label="Clear All Data"
    onClick={() => console.log('Data cleared')}
    confirmationTitle="Clear All Data"
    confirmationMessage="This will permanently remove all your data. This action cannot be undone."
    confirmButtonLabel="Clear All"
    cancelButtonLabel="Keep Data"
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
        onClick={() => {
          console.log('New document created')
          setHasContent(false)
        }}
        confirmationMessage="Discard current content and create a new document? Any unsaved changes will be lost."
        requiresCondition={() => hasContent}
      />
    </div>
  )
}

export const Disabled = () => (
  <DestructiveButton
    label="Delete Account"
    onClick={() => console.log('Account deleted')}
    confirmationMessage="Are you sure you want to delete your account?"
    disabled={true}
  />
)

export const Active = () => (
  <DestructiveButton
    label="Remove Item"
    onClick={() => console.log('Item removed')}
    confirmationMessage="Are you sure you want to remove this item?"
    active={true}
  />
)

export const LongMessage = () => (
  <DestructiveButton
    label="Delete Everything"
    onClick={() => console.log('Everything deleted')}
    confirmationTitle="Permanent Deletion Warning"
    confirmationMessage="This action will permanently delete all your documents, settings, and user data from our servers. This includes all your saved work, preferences, and account information. Once deleted, this data cannot be recovered through any means. Please make sure you have backed up any important information before proceeding. Are you absolutely certain you want to continue with this irreversible action?"
    confirmButtonLabel="Yes, Delete Everything"
    cancelButtonLabel="Cancel"
  />
)
