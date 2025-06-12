import React, { useEffect, useRef } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import styled from '@emotion/styled'
import { useTheme, keyframes } from '@emotion/react'

import 'prismjs/components/prism-markdown'

import editorDarkTheme from '../themes/prism-material-dark.css?inline'
import editorLightTheme from '../themes/prism-material-light.css?inline'

import { Label } from '../../app/components/Label'

interface Props {
  content: string
  onContentChange: (content: string) => void
  captureTab: boolean
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
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  background: theme.colors.paper,
  color: theme.colors.text,
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(0.5),
  opacity: 0,
  zIndex: 2,
  animation: `${fadeInOut} 1s ease-in-out`,
}))

const MarkdownEditor: React.FC<Props> = ({
  content,
  onContentChange,
  captureTab,
}) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  const highlight = (code: string) =>
    Prism.highlight(code, Prism.languages.markdown, 'markdown')

  useEffect(() => {
    // Focus the editor when a new file is created
    if (containerRef.current && content === '') {
      const textarea = containerRef.current.querySelector('textarea')
      if (textarea) {
        ;(textarea as HTMLTextAreaElement).focus()

        // Move cursor to the end
        const len = (textarea as HTMLTextAreaElement).value.length
        ;(textarea as HTMLTextAreaElement).setSelectionRange(len, len)
      }
    }
  }, [content])

  return (
    <>
      {theme.mode === 'dark' ? (
        <style>{editorDarkTheme}</style>
      ) : (
        <style>{editorLightTheme}</style>
      )}
      <EditorContainer className="editor-container" ref={containerRef}>
        <CaptureLabel key={String(captureTab)} size="tiny">
          {captureTab ? 'Tab captured' : 'Tab ignored'}
        </CaptureLabel>
        <label htmlFor="markdown-editor-input" className="sr-only">
          Markdown editor
        </label>
        <CodeEditor
          textareaId="markdown-editor-input"
          className="code-editor"
          value={content}
          onValueChange={onContentChange}
          highlight={highlight}
          ignoreTabKey={!captureTab}
          autoFocus
        />
      </EditorContainer>
    </>
  )
}

export default MarkdownEditor
