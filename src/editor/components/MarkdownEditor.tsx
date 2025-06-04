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
  flex: 1,
  overflow: 'auto',
  fontFamily: 'Courier New, Courier, monospace',
  fontSize: theme.fontSize.editor,
  lineHeight: '1.5',
  backgroundColor: theme.colors.backdrop,
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
}))

const CodeEditor = styled(Editor)(({ theme }) => ({
  background: theme.colors.background,
  maxWidth: theme.layout.pageWidth,
  minHeight: theme.layout.pageHeight,
  margin: `${theme.spacing(4)} auto`,
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
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
  '& .token.title': {
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
    if (containerRef.current && content === '') {
      const textarea = containerRef.current.querySelector('textarea')
      if (textarea) (textarea as HTMLTextAreaElement).focus()
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
          padding={theme.layout.pagePadding}
          autoFocus
        />
      </EditorContainer>
    </>
  )
}

export default MarkdownEditor
