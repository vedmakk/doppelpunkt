import React, { useEffect, useRef } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import styled from '@emotion/styled'

import 'prismjs/components/prism-markdown'

import editorDarkTheme from '../themes/prism-material-dark.css?inline'
import editorLightTheme from '../themes/prism-material-light.css?inline'

import { useTheme } from '@emotion/react'

interface Props {
  content: string
  onContentChange: (content: string) => void
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

const MarkdownEditor: React.FC<Props> = ({ content, onContentChange }) => {
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
        <CodeEditor
          className="code-editor"
          value={content}
          onValueChange={onContentChange}
          highlight={highlight}
          autoFocus
        />
      </EditorContainer>
    </>
  )
}

export default MarkdownEditor
