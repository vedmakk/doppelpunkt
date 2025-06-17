import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { injectVisualIndents, stripVisualIndents } from '../utils/visualIndent'
import { computeListEnter } from '../utils/computeListEnter'

import { useDispatch } from 'react-redux'

import { useEditorText, useCaptureTabEnabled } from '../hooks'
import { setText, setCaptureTab } from '../editorSlice'
import { useCustomHotkey } from '../../hotkeys/hooks'
import { HotkeyId } from '../../hotkeys/registry'

import MarkdownEditorComponent from '../components/MarkdownEditor'

const MarkdownEditor: React.FC = () => {
  const [charsPerLine, setCharsPerLine] = useState<number>(80)

  const containerRef = useRef<HTMLDivElement>(null)

  const content = useEditorText()
  const captureTab = useCaptureTabEnabled()

  const dispatch = useDispatch()

  const displayContent = useMemo(
    () => injectVisualIndents(content, charsPerLine),
    [content, charsPerLine],
  )

  const handleContentChange = useCallback(
    (content: string) => {
      const sanitized = stripVisualIndents(content)
      dispatch(setText(sanitized))
    },
    [dispatch],
  )

  const toggleCaptureTab = useCallback(() => {
    dispatch(setCaptureTab(!captureTab))
  }, [dispatch, captureTab])

  useCustomHotkey(HotkeyId.ToggleCaptureTab, toggleCaptureTab)

  // Handle custom list behaviours and Shift+Enter soft line breaks
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') {
        return
      }

      if (!(e.currentTarget instanceof HTMLTextAreaElement)) {
        return
      }

      const textarea = e.currentTarget as HTMLTextAreaElement

      const result = computeListEnter({
        value: textarea.value,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
        shiftKey: e.shiftKey,
      })

      if (!result) {
        // Not a list scenario – allow default behaviour.
        return
      }

      const { newValue, newCursor } = result

      e.preventDefault()

      handleContentChange(newValue)

      // Restore caret position in the next tick once React has flushed the
      // state update and the value prop has propagated to the underlying
      // textarea.
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursor
      })
    },
    [handleContentChange],
  )

  const focusEditor = useCallback(() => {
    if (containerRef.current) {
      const textarea = containerRef.current.querySelector('textarea')
      if (textarea) {
        ;(textarea as HTMLTextAreaElement).focus()

        // Move cursor to the end
        const len = (textarea as HTMLTextAreaElement).value.length
        ;(textarea as HTMLTextAreaElement).setSelectionRange(len, len)
      }
    }
  }, [containerRef])

  // ------------------------------------------------------------------
  // Determine roughly how many monospace characters fit on a single
  // physical line inside the textarea.  This allows us to mimic the
  // browser's soft-wrapping so that we can inject matching visual
  // indents for wrapped list items.
  // ------------------------------------------------------------------
  useEffect(() => {
    const calc = () => {
      const textarea = containerRef.current?.querySelector('textarea') as
        | HTMLTextAreaElement
        | undefined
      if (!textarea) return

      const cs = window.getComputedStyle(textarea)

      const padLeft = parseFloat(cs.paddingLeft || '0')
      const padRight = parseFloat(cs.paddingRight || '0')
      const availWidth = textarea.clientWidth - padLeft - padRight

      // Measure width of a single glyph
      const m = document.createElement('span')
      m.textContent = 'a'.repeat(100) // Reduce rounding errors
      m.style.fontFamily = cs.fontFamily
      m.style.fontSize = cs.fontSize
      m.style.whiteSpace = 'pre'
      m.style.visibility = 'hidden'
      document.body.appendChild(m)
      const charWidth = m.getBoundingClientRect().width / 100
      document.body.removeChild(m)

      if (!charWidth) return

      const per = Math.floor(availWidth / charWidth)
      if (per > 0) {
        setCharsPerLine(per)
      }
    }

    calc()

    const ro = new ResizeObserver(calc)
    const textarea = containerRef.current?.querySelector('textarea')
    if (textarea) ro.observe(textarea)

    window.addEventListener('resize', calc)

    // Re-run once all fonts that affect the textarea are loaded
    if ('fonts' in document) {
      // Fires once when every pending font-face is ready
      document.fonts.ready.then(calc)
      // Fires any time a new font family finishes loading later
      document.fonts.addEventListener('loadingdone', calc)
    }

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', calc)
      if ('fonts' in document) {
        document.fonts.removeEventListener('loadingdone', calc)
      }
    }
  }, [])

  // Focus the editor initially
  useEffect(() => {
    focusEditor()
  }, [focusEditor])

  // Focus the editor when a new file is created
  useEffect(() => {
    if (content === '') {
      focusEditor()
    }
  }, [content, focusEditor])

  return (
    <MarkdownEditorComponent
      content={displayContent}
      onContentChange={handleContentChange}
      captureTab={captureTab}
      onKeyDown={handleKeyDown}
      containerRef={containerRef}
    />
  )
}

export default MarkdownEditor
