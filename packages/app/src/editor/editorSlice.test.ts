import { describe, it, expect } from 'bun:test'
import {
  setText,
  clear,
  load,
  toggleAutoSave,
  setCaptureTab,
} from './editorSlice'
import { createStore } from '../store'
import { TUTORIAL_PLACEHOLDER } from './tutorial'

describe('editorSlice', () => {
  describe('setText', () => {
    it(`should handle ${setText.type} action for editor mode`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      const initialDoc = getEditorState().documents.editor
      expect(initialDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(initialDoc.cursorPos).toBe(0)

      store.dispatch(
        setText({
          mode: 'editor',
          text: 'New editor content',
          cursorPos: 5,
        }),
      )

      const updatedDoc = getEditorState().documents.editor
      expect(updatedDoc.text).toBe('New editor content')
      expect(updatedDoc.cursorPos).toBe(5)

      // Should not affect todo document
      const todoDoc = getEditorState().documents.todo
      expect(todoDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(todoDoc.cursorPos).toBe(0)
    })

    it(`should handle ${setText.type} action for todo mode`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      store.dispatch(
        setText({
          mode: 'todo',
          text: '- Todo item 1\n- Todo item 2',
          cursorPos: 15,
        }),
      )

      const todoDoc = getEditorState().documents.todo
      expect(todoDoc.text).toBe('- Todo item 1\n- Todo item 2')
      expect(todoDoc.cursorPos).toBe(15)

      // Should not affect editor document
      const editorDoc = getEditorState().documents.editor
      expect(editorDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(editorDoc.cursorPos).toBe(0)
    })

    it(`should not update when text is the same`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      // First update
      store.dispatch(
        setText({
          mode: 'editor',
          text: 'Same content',
          cursorPos: 5,
        }),
      )

      const firstUpdate = getEditorState().documents.editor
      expect(firstUpdate.text).toBe('Same content')
      expect(firstUpdate.cursorPos).toBe(5)

      // Second update with same text should be ignored (no-op due to early return)
      store.dispatch(
        setText({
          mode: 'editor',
          text: 'Same content',
          cursorPos: 10, // Different cursor position
        }),
      )

      const secondUpdate = getEditorState().documents.editor
      // Text should remain the same, cursor position should not be updated
      expect(secondUpdate.text).toBe('Same content')
      expect(secondUpdate.cursorPos).toBe(5) // Should remain unchanged
    })

    it('should handle empty text', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      store.dispatch(
        setText({
          mode: 'editor',
          text: '',
          cursorPos: 0,
        }),
      )

      const doc = getEditorState().documents.editor
      expect(doc.text).toBe('')
      expect(doc.cursorPos).toBe(0)
    })

    it('should handle large cursor positions', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      store.dispatch(
        setText({
          mode: 'editor',
          text: 'Short',
          cursorPos: 1000, // Cursor beyond text length
        }),
      )

      const doc = getEditorState().documents.editor
      expect(doc.text).toBe('Short')
      expect(doc.cursorPos).toBe(5) // Sanitization middleware clamps to text length
    })
  })

  describe('clear', () => {
    it(`should handle ${clear.type} action for editor mode`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      // First set some content
      store.dispatch(
        setText({
          mode: 'editor',
          text: 'Content to be cleared',
          cursorPos: 10,
        }),
      )

      expect(getEditorState().documents.editor.text).toBe(
        'Content to be cleared',
      )
      expect(getEditorState().documents.editor.cursorPos).toBe(10)

      // Clear the editor
      store.dispatch(clear({ mode: 'editor' }))

      const clearedDoc = getEditorState().documents.editor
      expect(clearedDoc.text).toBe('')
      expect(clearedDoc.cursorPos).toBe(0)

      // Should not affect todo document
      const todoDoc = getEditorState().documents.todo
      expect(todoDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(todoDoc.cursorPos).toBe(0)
    })

    it(`should handle ${clear.type} action for todo mode`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      // First set some content
      store.dispatch(
        setText({
          mode: 'todo',
          text: '- Todo to be cleared',
          cursorPos: 5,
        }),
      )

      // Clear the todo
      store.dispatch(clear({ mode: 'todo' }))

      const clearedDoc = getEditorState().documents.todo
      expect(clearedDoc.text).toBe('')
      expect(clearedDoc.cursorPos).toBe(0)

      // Should not affect editor document
      const editorDoc = getEditorState().documents.editor
      expect(editorDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(editorDoc.cursorPos).toBe(0)
    })
  })

  describe('load', () => {
    it(`should handle ${load.type} action for editor mode`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      const textToLoad = 'Loaded editor content'
      store.dispatch(load({ mode: 'editor', text: textToLoad }))

      const loadedDoc = getEditorState().documents.editor
      expect(loadedDoc.text).toBe(textToLoad)
      expect(loadedDoc.cursorPos).toBe(textToLoad.length) // Should set cursor to end

      // Should not affect todo document
      const todoDoc = getEditorState().documents.todo
      expect(todoDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(todoDoc.cursorPos).toBe(0)
    })

    it(`should handle ${load.type} action for todo mode`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      const textToLoad = '- Loaded todo item 1\n- Loaded todo item 2'
      store.dispatch(load({ mode: 'todo', text: textToLoad }))

      const loadedDoc = getEditorState().documents.todo
      expect(loadedDoc.text).toBe(textToLoad)
      expect(loadedDoc.cursorPos).toBe(textToLoad.length)

      // Should not affect editor document
      const editorDoc = getEditorState().documents.editor
      expect(editorDoc.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(editorDoc.cursorPos).toBe(0)
    })

    it('should handle loading empty text', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      store.dispatch(load({ mode: 'editor', text: '' }))

      const loadedDoc = getEditorState().documents.editor
      expect(loadedDoc.text).toBe('')
      expect(loadedDoc.cursorPos).toBe(0)
    })

    it('should handle loading very long text', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      const longText = 'A'.repeat(10000)
      store.dispatch(load({ mode: 'editor', text: longText }))

      const loadedDoc = getEditorState().documents.editor
      expect(loadedDoc.text).toBe(longText)
      expect(loadedDoc.cursorPos).toBe(10000)
    })
  })

  describe('toggleAutoSave', () => {
    it(`should handle ${toggleAutoSave.type} action`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      expect(getEditorState().autoSave).toBe(false)

      store.dispatch(toggleAutoSave(true))
      expect(getEditorState().autoSave).toBe(true)

      store.dispatch(toggleAutoSave(false))
      expect(getEditorState().autoSave).toBe(false)
    })
  })

  describe('setCaptureTab', () => {
    it(`should handle ${setCaptureTab.type} action`, () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      expect(getEditorState().captureTab).toBe(true)

      store.dispatch(setCaptureTab(false))
      expect(getEditorState().captureTab).toBe(false)

      store.dispatch(setCaptureTab(true))
      expect(getEditorState().captureTab).toBe(true)
    })
  })

  describe('complex editor workflows', () => {
    it('should handle multiple document operations', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      // Load content in both modes
      store.dispatch(load({ mode: 'editor', text: 'Editor content' }))
      store.dispatch(load({ mode: 'todo', text: '- Todo item' }))

      expect(getEditorState().documents.editor.text).toBe('Editor content')
      expect(getEditorState().documents.todo.text).toBe('- Todo item')

      // Update editor text
      store.dispatch(
        setText({
          mode: 'editor',
          text: 'Updated editor content',
          cursorPos: 8,
        }),
      )

      expect(getEditorState().documents.editor.text).toBe(
        'Updated editor content',
      )
      expect(getEditorState().documents.editor.cursorPos).toBe(8)

      // Todo should remain unchanged
      expect(getEditorState().documents.todo.text).toBe('- Todo item')
      expect(getEditorState().documents.todo.cursorPos).toBe(11)

      // Clear editor
      store.dispatch(clear({ mode: 'editor' }))

      expect(getEditorState().documents.editor.text).toBe('')
      expect(getEditorState().documents.editor.cursorPos).toBe(0)

      // Todo should still be unchanged
      expect(getEditorState().documents.todo.text).toBe('- Todo item')
      expect(getEditorState().documents.todo.cursorPos).toBe(11)
    })

    it('should handle settings changes', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      // Initial settings
      expect(getEditorState().autoSave).toBe(false)
      expect(getEditorState().captureTab).toBe(true)

      // Change both settings
      store.dispatch(toggleAutoSave(true))
      store.dispatch(setCaptureTab(false))

      expect(getEditorState().autoSave).toBe(true)
      expect(getEditorState().captureTab).toBe(false)

      // Settings changes should not affect documents
      expect(getEditorState().documents.editor.text).toBe(TUTORIAL_PLACEHOLDER)
      expect(getEditorState().documents.todo.text).toBe(TUTORIAL_PLACEHOLDER)
    })

    it('should handle text operations with unicode characters', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      const unicodeText = '🚀 Hello 世界! 🌟'
      store.dispatch(
        setText({
          mode: 'editor',
          text: unicodeText,
          cursorPos: 5,
        }),
      )

      const doc = getEditorState().documents.editor
      expect(doc.text).toBe(unicodeText)
      expect(doc.cursorPos).toBe(5)

      // Load unicode text
      const unicodeLoad = '📝 Notes: こんにちは'
      store.dispatch(load({ mode: 'todo', text: unicodeLoad }))

      const todoDoc = getEditorState().documents.todo
      expect(todoDoc.text).toBe(unicodeLoad)
      expect(todoDoc.cursorPos).toBe(unicodeLoad.length)
    })

    it('should handle rapid consecutive operations', () => {
      const store = createStore()
      const getEditorState = () => store.getState().editor

      // Rapid text updates
      store.dispatch(
        setText({ mode: 'editor', text: 'Version 1', cursorPos: 0 }),
      )
      store.dispatch(
        setText({ mode: 'editor', text: 'Version 2', cursorPos: 1 }),
      )
      store.dispatch(
        setText({ mode: 'editor', text: 'Version 3', cursorPos: 2 }),
      )

      expect(getEditorState().documents.editor.text).toBe('Version 3')
      expect(getEditorState().documents.editor.cursorPos).toBe(2)

      // Rapid setting changes
      store.dispatch(toggleAutoSave(true))
      store.dispatch(setCaptureTab(false))
      store.dispatch(toggleAutoSave(false))
      store.dispatch(setCaptureTab(true))

      expect(getEditorState().autoSave).toBe(false)
      expect(getEditorState().captureTab).toBe(true)
    })
  })
})
