import { describe, it, expect } from 'bun:test'

import { PresentationContext } from '../../types'

import { VISUAL_INDENT_CHAR } from '../../../utils/visualIndent'

import {
  visualIndentTransformer,
  visualIndentStripper,
} from './visualIndentTransformer'

describe('visualIndentTransformer utilities', () => {
  describe('visualIndentStripper', () => {
    it('adjusts the cursor position when indents were present before the cursor', () => {
      const input = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const caret = 10

      const context: PresentationContext = {
        text: input,
        cursorPos: caret,
      }

      const { text: sanitizedValue, cursorPos: sanitizedCursorPos } =
        visualIndentStripper.transform(input, context)
      expect(sanitizedValue).toBe('- itemcontinued')
      expect(sanitizedCursorPos).toBe(caret - 3)
    })

    it('adjusts the cursor position only for indents that were present before the cursor', () => {
      const input = `- item\n${VISUAL_INDENT_CHAR.repeat(2)}continued\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const caret = 10

      const context: PresentationContext = {
        text: input,
        cursorPos: caret,
      }

      const { text: sanitizedValue, cursorPos: sanitizedCursorPos } =
        visualIndentStripper.transform(input, context)
      expect(sanitizedValue).toBe('- itemcontinuedcontinued')
      expect(sanitizedCursorPos).toBe(caret - 3)
    })

    it('does not adjust the cursor position for indents that were present after the cursor', () => {
      const input = `- itemcontinued\n${VISUAL_INDENT_CHAR.repeat(2)}continued`
      const caret = 10

      const context: PresentationContext = {
        text: input,
        cursorPos: caret,
      }

      const { text: sanitizedValue, cursorPos: sanitizedCursorPos } =
        visualIndentStripper.transform(input, context)
      expect(sanitizedValue).toBe('- itemcontinuedcontinued')
      expect(sanitizedCursorPos).toBe(caret)
    })
  })

  describe('visualIndentTransformer', () => {
    it('adjusts the cursor position when indents were inserted before the cursor', () => {
      const raw = '- lorem ipsum'
      const maxChars = 7
      const caret = raw.length

      const context: PresentationContext = {
        text: raw,
        cursorPos: caret,
        maxCharsPerLine: maxChars,
      }

      const { text, cursorPos } = visualIndentTransformer.transform(
        raw,
        context,
      )
      expect(text).toBe(`- lorem \n${VISUAL_INDENT_CHAR.repeat(2)}ipsum`)
      expect(cursorPos).toBe(caret + 3)
    })

    it('adjust the cursor position only for indents that were inserted before the cursor', () => {
      const raw = '- ' + 'test '.repeat(3)
      const maxChars = 'test'.length
      const caret = 'test'.length + 4 // after the first 'test'

      const context: PresentationContext = {
        text: raw,
        cursorPos: caret,
        maxCharsPerLine: maxChars,
      }

      const { text, cursorPos } = visualIndentTransformer.transform(
        raw,
        context,
      )
      expect(text).toBe(
        `- test \n${VISUAL_INDENT_CHAR.repeat(2)}test \n${VISUAL_INDENT_CHAR.repeat(2)}test `,
      )
      expect(cursorPos).toBe(caret + 3)
    })

    it('does not adjust the cursor position for indents that were inserted after the cursor', () => {
      const raw = '- lorem ipsum'
      const maxChars = 7
      const caret = 3

      const context: PresentationContext = {
        text: raw,
        cursorPos: caret,
        maxCharsPerLine: maxChars,
      }

      const { text, cursorPos } = visualIndentTransformer.transform(
        raw,
        context,
      )
      expect(text).toBe(`- lorem \n${VISUAL_INDENT_CHAR.repeat(2)}ipsum`)
      expect(cursorPos).toBe(caret)
    })
  })
})
