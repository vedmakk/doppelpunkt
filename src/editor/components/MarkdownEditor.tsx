import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import styled from '@emotion/styled'
import { useTheme, keyframes } from '@emotion/react'

import 'prismjs/components/prism-markdown'

import editorDarkTheme from '../themes/prism-material-dark.css?inline'
import editorLightTheme from '../themes/prism-material-light.css?inline'

import { useHasKeyboard } from '../../hotkeys/hooks'

import { Label } from '../../app/components/Label'
import { LogoAlignContainer } from '../../menu/components/Logo'

// Visual indentation helpers for soft-wrapped list items
import { injectVisualIndents, stripVisualIndents } from '../utils/visualIndent'

interface Props {
  content: string
  onContentChange: (content: string) => void
  captureTab: boolean
  onKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement> &
      React.KeyboardEvent<HTMLTextAreaElement>,
  ) => void
}

const EditorContainer = styled.div(({ theme }) => ({
  position: 'relative',
  [theme.breakpoints.toolbar]: {
    width: 'fit-content',
    margin: '0 auto',
  },
  '@media print': {
    width: 'auto',
    margin: 0,
  },
  fontFamily: 'Fira Code, monospace',
  fontSize: theme.fontSize.editor,
  lineHeight: '1.5',
}))

const CodeEditor = styled(Editor)(({ theme }) => ({
  width: '100%',
  minHeight: '100vh',
  '& > pre, & > textarea': {
    padding: `${theme.layout.pagePadding} ${theme.spacing(2)} !important`,
  },
  [theme.breakpoints.page]: {
    '& > pre, & > textarea': {
      padding: `${theme.layout.pagePadding} !important`,
    },
  },
  [theme.breakpoints.toolbar]: {
    width: theme.layout.pageWidth,
    minHeight: theme.layout.pageHeight,
    boxShadow:
      theme.mode === 'dark'
        ? `none`
        : `0 0 ${theme.spacing(1)} 0 ${theme.colors.shadow}`,
    borderRadius: theme.spacing(0.5),
  },
  '@media print': {
    width: 'auto',
    minHeight: 'auto',
    overflow: 'visible',
    '& > pre': {
      padding: '0 !important',
    },
  },
  backgroundColor: theme.colors.page,
  transition: `background-color ${theme.animations.transition}`,
  '& > pre > *': {
    transition: `color ${theme.animations.transition}`,
  },
  whiteSpace: 'pre-wrap',
  '& textarea': {
    outline: 'none',
  },
  '& .token.url': {
    background: 'none',
    color: theme.colors.punctuation,
    '& > .content': {
      color: theme.colors.primary,
      background: theme.colors.paper,
      borderRadius: theme.spacing(0.5),
    },
    '& > .url': {
      color: theme.colors.primary,
    },
  },
  '& .token.punctuation': {
    color: theme.colors.punctuation,
  },
  '& .token.title, & .token.important': {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  '& .token.code-snippet': {
    color: theme.colors.primary,
    background: theme.colors.paper,
    borderRadius: theme.spacing(0.5),
  },
  '& .token.code-block > .operator': {
    background: 'none',
  },
}))

// keyframes for fade-in/out
const fadeInOut = keyframes`
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
`

// styled label that animates on mount
const CaptureLabel = styled(Label)(({ theme }) => ({
  background: theme.colors.paper,
  color: theme.colors.primary,
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(0.5),
  opacity: 0,
  animation: `${fadeInOut} 2s ease-in-out`,
}))

const StyledLogoAlignContainer = styled(LogoAlignContainer)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2.5),
  zIndex: 2,
}))

const MarkdownEditor: React.FC<Props> = ({
  content,
  onContentChange,
  captureTab,
  onKeyDown,
}) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  // ------------------------------------------------------------------
  // Determine roughly how many monospace characters fit on a single
  // physical line inside the textarea.  This allows us to mimic the
  // browser's soft-wrapping so that we can inject matching visual
  // indents for wrapped list items.
  // ------------------------------------------------------------------

  const [charsPerLine, setCharsPerLine] = useState<number>(80)

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
      m.textContent = 'a'
      m.style.fontFamily = cs.fontFamily
      m.style.fontSize = cs.fontSize
      m.style.whiteSpace = 'pre'
      m.style.visibility = 'hidden'
      document.body.appendChild(m)
      const charWidth = m.getBoundingClientRect().width || 8
      document.body.removeChild(m)

      if (!charWidth) return

      const per = Math.floor(availWidth / charWidth)
      if (per > 0 && per !== charsPerLine) {
        setCharsPerLine(per)
      }
    }

    calc()

    const ro = new ResizeObserver(calc)
    const textarea = containerRef.current?.querySelector('textarea')
    if (textarea) ro.observe(textarea)

    window.addEventListener('resize', calc)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', calc)
    }
  }, [charsPerLine])

  const hasKeyboard = useHasKeyboard()

  const highlight = (code: string) =>
    Prism.highlight(code, Prism.languages.markdown, 'markdown')

  // Derive the display version of the content that includes visual indents
  const displayContent = useMemo(
    () => injectVisualIndents(content, charsPerLine),
    [content, charsPerLine],
  )

  const handleDisplayChange = useCallback(
    (newDisplayValue: string) => {
      const sanitized = stripVisualIndents(newDisplayValue)
      onContentChange(sanitized)
    },
    [onContentChange],
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
    <>
      {theme.mode === 'dark' ? (
        <style>{editorDarkTheme}</style>
      ) : (
        <style>{editorLightTheme}</style>
      )}
      <EditorContainer className="editor-container" ref={containerRef}>
        {hasKeyboard && (
          <StyledLogoAlignContainer>
            <CaptureLabel key={String(captureTab)} size="tiny">
              {captureTab ? 'Capturing tab' : 'Ignoring tab'}
            </CaptureLabel>
          </StyledLogoAlignContainer>
        )}
        <label htmlFor="markdown-editor-input" className="sr-only">
          Markdown editor
        </label>
        <CodeEditor
          textareaId="markdown-editor-input"
          className="code-editor"
          value={displayContent}
          onValueChange={handleDisplayChange}
          onKeyDown={onKeyDown}
          highlight={highlight}
          ignoreTabKey={!captureTab}
          autoFocus
        />
      </EditorContainer>
    </>
  )
}

export default MarkdownEditor
