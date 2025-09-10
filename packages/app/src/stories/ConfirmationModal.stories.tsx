import React from 'react'
import { ConfirmationModal } from '../destructive-actions'
import { Button } from '../app/components/Button'
import { CommonStoryDecorator } from './CommonStoryDecorator'

export default {
  title: 'Components/ConfirmationModal',
  decorators: [CommonStoryDecorator],
}

export const Default = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)

  const openModal = () => {
    setShouldRender(true)
    setIsOpen(true)
  }

  return (
    <div>
      <Button label="Open Confirmation Modal" onClick={openModal} />
      <ConfirmationModal
        isOpen={isOpen}
        shouldRender={shouldRender}
        onClose={() => setIsOpen(false)}
        setShouldRender={setShouldRender}
        title="Confirm Action"
        message="Are you sure you want to perform this action?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => {
          console.log('Confirmed')
          setIsOpen(false)
        }}
      />
    </div>
  )
}

export const Destructive = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)

  const openModal = () => {
    setShouldRender(true)
    setIsOpen(true)
  }

  return (
    <div>
      <Button label="Open Destructive Modal" onClick={openModal} />
      <ConfirmationModal
        isOpen={isOpen}
        shouldRender={shouldRender}
        onClose={() => setIsOpen(false)}
        setShouldRender={setShouldRender}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        onConfirm={() => {
          console.log('Account deleted')
          setIsOpen(false)
        }}
        destructive={true}
      />
    </div>
  )
}

export const LongMessage = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)

  const openModal = () => {
    setShouldRender(true)
    setIsOpen(true)
  }

  return (
    <div>
      <Button label="Open Long Message Modal" onClick={openModal} />
      <ConfirmationModal
        isOpen={isOpen}
        shouldRender={shouldRender}
        onClose={() => setIsOpen(false)}
        setShouldRender={setShouldRender}
        title="Permanent Data Deletion"
        message="This action will permanently delete all your documents, settings, and user data from our servers. This includes all your saved work, preferences, and account information. Once deleted, this data cannot be recovered through any means. Please make sure you have backed up any important information before proceeding. Are you absolutely certain you want to continue with this irreversible action?"
        confirmLabel="Yes, Delete Everything"
        cancelLabel="Keep My Data"
        onConfirm={() => {
          console.log('Everything deleted')
          setIsOpen(false)
        }}
        destructive={true}
      />
    </div>
  )
}

export const CustomTitle = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)

  const openModal = () => {
    setShouldRender(true)
    setIsOpen(true)
  }

  return (
    <div>
      <Button label="Open Custom Title Modal" onClick={openModal} />
      <ConfirmationModal
        isOpen={isOpen}
        shouldRender={shouldRender}
        onClose={() => setIsOpen(false)}
        setShouldRender={setShouldRender}
        title="Save Changes Before Closing?"
        message="You have unsaved changes. Would you like to save them before closing this document?"
        confirmLabel="Save & Close"
        cancelLabel="Close Without Saving"
        onConfirm={() => {
          console.log('Saved and closed')
          setIsOpen(false)
        }}
        destructive={false}
      />
    </div>
  )
}
