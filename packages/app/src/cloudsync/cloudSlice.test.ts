import { describe, it, expect } from 'bun:test'
import {
  setCloudEnabled,
  setCloudStatus,
  setCloudUser,
  setCloudError,
  setCloudDocBase,
  setCloudDocSnapshotMeta,
  requestGoogleSignIn,
  requestSignOut,
  requestDeleteUser,
  requestSync,
} from './cloudSlice'
import { createStore } from '../store'

describe('cloudSlice', () => {
  describe('setCloudEnabled', () => {
    it(`should handle ${setCloudEnabled.type} action`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      expect(getCloudState().enabled).toBe(false)

      store.dispatch(setCloudEnabled(true))
      expect(getCloudState().enabled).toBe(true)

      store.dispatch(setCloudEnabled(false))
      expect(getCloudState().enabled).toBe(false)
    })
  })

  describe('setCloudStatus', () => {
    it(`should handle ${setCloudStatus.type} action`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      expect(getCloudState().status).toBe('idle')

      store.dispatch(setCloudStatus('initializing'))
      expect(getCloudState().status).toBe('initializing')

      store.dispatch(setCloudStatus('connected'))
      expect(getCloudState().status).toBe('connected')

      store.dispatch(setCloudStatus('error'))
      expect(getCloudState().status).toBe('error')
    })
  })

  describe('setCloudUser', () => {
    it(`should handle ${setCloudUser.type} action with user data`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      expect(getCloudState().user).toBe(null)

      const userData = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      }

      store.dispatch(setCloudUser(userData))
      expect(getCloudState().user).toEqual(userData)
    })

    it(`should handle ${setCloudUser.type} action with null`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      // First set a user
      const userData = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      }
      store.dispatch(setCloudUser(userData))
      expect(getCloudState().user).toEqual(userData)

      // Then clear it
      store.dispatch(setCloudUser(null))
      expect(getCloudState().user).toBe(null)
    })

    it(`should handle ${setCloudUser.type} action with partial user data`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      const partialUserData = {
        uid: 'test-uid',
        displayName: null,
        email: null,
        photoURL: null,
      }

      store.dispatch(setCloudUser(partialUserData))
      expect(getCloudState().user).toEqual(partialUserData)
    })
  })

  describe('setCloudError', () => {
    it(`should handle ${setCloudError.type} action with error message`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      expect(getCloudState().error).toBeUndefined()

      store.dispatch(setCloudError('Network error'))
      expect(getCloudState().error).toBe('Network error')
    })

    it(`should handle ${setCloudError.type} action with undefined`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      // First set an error
      store.dispatch(setCloudError('Network error'))
      expect(getCloudState().error).toBe('Network error')

      // Then clear it
      store.dispatch(setCloudError(undefined))
      expect(getCloudState().error).toBeUndefined()
    })
  })

  describe('setCloudDocBase', () => {
    it(`should handle ${setCloudDocBase.type} action for editor mode`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      const initialEditorDoc = getCloudState().docs.editor
      expect(initialEditorDoc.baseRev).toBe(0)
      expect(initialEditorDoc.baseText).toBe('')

      store.dispatch(
        setCloudDocBase({
          mode: 'editor',
          baseRev: 5,
          baseText: 'Updated editor content',
        }),
      )

      const updatedEditorDoc = getCloudState().docs.editor
      expect(updatedEditorDoc.baseRev).toBe(5)
      expect(updatedEditorDoc.baseText).toBe('Updated editor content')

      // Should not affect todo doc
      const todoDoc = getCloudState().docs.todo
      expect(todoDoc.baseRev).toBe(0)
      expect(todoDoc.baseText).toBe('')
    })

    it(`should handle ${setCloudDocBase.type} action for todo mode`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      store.dispatch(
        setCloudDocBase({
          mode: 'todo',
          baseRev: 3,
          baseText: '- Todo item 1\n- Todo item 2',
        }),
      )

      const todoDoc = getCloudState().docs.todo
      expect(todoDoc.baseRev).toBe(3)
      expect(todoDoc.baseText).toBe('- Todo item 1\n- Todo item 2')

      // Should not affect editor doc
      const editorDoc = getCloudState().docs.editor
      expect(editorDoc.baseRev).toBe(0)
      expect(editorDoc.baseText).toBe('')
    })
  })

  describe('setCloudDocSnapshotMeta', () => {
    it(`should handle ${setCloudDocSnapshotMeta.type} action for editor mode`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      const initialEditorDoc = getCloudState().docs.editor
      expect(initialEditorDoc.hasPendingWrites).toBe(false)
      expect(initialEditorDoc.fromCache).toBe(false)

      store.dispatch(
        setCloudDocSnapshotMeta({
          mode: 'editor',
          hasPendingWrites: true,
          fromCache: true,
        }),
      )

      const updatedEditorDoc = getCloudState().docs.editor
      expect(updatedEditorDoc.hasPendingWrites).toBe(true)
      expect(updatedEditorDoc.fromCache).toBe(true)

      // Should not affect todo doc
      const todoDoc = getCloudState().docs.todo
      expect(todoDoc.hasPendingWrites).toBe(false)
      expect(todoDoc.fromCache).toBe(false)
    })

    it(`should handle ${setCloudDocSnapshotMeta.type} action for todo mode`, () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      store.dispatch(
        setCloudDocSnapshotMeta({
          mode: 'todo',
          hasPendingWrites: false,
          fromCache: true,
        }),
      )

      const todoDoc = getCloudState().docs.todo
      expect(todoDoc.hasPendingWrites).toBe(false)
      expect(todoDoc.fromCache).toBe(true)

      // Should not affect editor doc
      const editorDoc = getCloudState().docs.editor
      expect(editorDoc.hasPendingWrites).toBe(false)
      expect(editorDoc.fromCache).toBe(false)
    })
  })

  describe('UI intent actions', () => {
    it(`should handle ${requestGoogleSignIn.type} action`, () => {
      const store = createStore()
      const initialState = store.getState().cloud

      store.dispatch(requestGoogleSignIn())

      // UI intent actions should not change state
      expect(store.getState().cloud).toEqual(initialState)
    })

    it(`should handle ${requestSignOut.type} action`, () => {
      const store = createStore()
      const initialState = store.getState().cloud

      store.dispatch(requestSignOut())

      // UI intent actions should not change state
      expect(store.getState().cloud).toEqual(initialState)
    })

    it(`should handle ${requestDeleteUser.type} action`, () => {
      const store = createStore()
      const initialState = store.getState().cloud

      store.dispatch(requestDeleteUser())

      // UI intent actions should not change state directly
      // (middleware may handle this action and update state)
      const finalState = store.getState().cloud
      expect(finalState.enabled).toBe(initialState.enabled)
      expect(finalState.status).toBe(initialState.status)
      expect(finalState.user).toBe(initialState.user)
    })

    it.skip(`should handle ${requestSync.type} action`, () => {
      const store = createStore()
      const initialState = store.getState().cloud

      store.dispatch(requestSync())

      // UI intent actions should not change state
      expect(store.getState().cloud).toEqual(initialState)
    })
  })

  describe('complex state scenarios', () => {
    it('should handle full cloud sync workflow', () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      // Initial state
      expect(getCloudState().enabled).toBe(false)
      expect(getCloudState().status).toBe('idle')
      expect(getCloudState().user).toBe(null)

      // Enable cloud
      store.dispatch(setCloudEnabled(true))
      expect(getCloudState().enabled).toBe(true)

      // Start initializing
      store.dispatch(setCloudStatus('initializing'))
      expect(getCloudState().status).toBe('initializing')

      // User signs in
      const userData = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      }
      store.dispatch(setCloudUser(userData))
      store.dispatch(setCloudStatus('connected'))

      expect(getCloudState().user).toEqual(userData)
      expect(getCloudState().status).toBe('connected')

      // Sync documents
      store.dispatch(
        setCloudDocBase({
          mode: 'editor',
          baseRev: 1,
          baseText: 'Initial content',
        }),
      )
      store.dispatch(
        setCloudDocSnapshotMeta({
          mode: 'editor',
          hasPendingWrites: false,
          fromCache: false,
        }),
      )

      const editorDoc = getCloudState().docs.editor
      expect(editorDoc.baseRev).toBe(1)
      expect(editorDoc.baseText).toBe('Initial content')
      expect(editorDoc.hasPendingWrites).toBe(false)
      expect(editorDoc.fromCache).toBe(false)
    })

    it('should handle error scenarios', () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      // Enable cloud and start connecting
      store.dispatch(setCloudEnabled(true))
      store.dispatch(setCloudStatus('initializing'))

      // Error occurs
      store.dispatch(setCloudError('Network connection failed'))
      store.dispatch(setCloudStatus('error'))

      expect(getCloudState().status).toBe('error')
      expect(getCloudState().error).toBe('Network connection failed')

      // Clear error and retry
      store.dispatch(setCloudError(undefined))
      store.dispatch(setCloudStatus('initializing'))

      expect(getCloudState().error).toBeUndefined()
      expect(getCloudState().status).toBe('initializing')
    })

    it('should handle user sign out', () => {
      const store = createStore()
      const getCloudState = () => store.getState().cloud

      // User is signed in
      const userData = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      }
      store.dispatch(setCloudUser(userData))
      store.dispatch(setCloudStatus('connected'))

      // User signs out
      store.dispatch(setCloudUser(null))
      store.dispatch(setCloudStatus('idle'))

      expect(getCloudState().user).toBe(null)
      expect(getCloudState().status).toBe('idle')
    })
  })
})
