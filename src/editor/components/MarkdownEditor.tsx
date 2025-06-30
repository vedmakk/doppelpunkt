import React from 'react'
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

interface Props {
  content: string
  onContentChange: (content: string) => void
  captureTab: boolean
  onKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement> &
      React.KeyboardEvent<HTMLTextAreaElement>,
  ) => void
  onCopy: (e: React.ClipboardEvent<HTMLDivElement>) => void
  containerRef: React.RefObject<HTMLDivElement | null>
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
    boxShadow: `0 0 ${theme.spacing(1)} 0 ${theme.colors.shadow}`,
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
    transition: `color ${theme.animations.transition}, background-color ${theme.animations.transition}`,
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
  '& .token.strike > .content': {
    textDecoration: 'line-through',
  },
  '& .token.variable': {
    color: theme.colors.primary,
  },
  '& .token.operator': {
    color: theme.colors.punctuation,
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
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
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
  onCopy,
  containerRef,
}) => {
  const theme = useTheme()

  const hasKeyboard = useHasKeyboard()

  const highlight = (code: string) =>
    Prism.highlight(code, Prism.languages.markdown, 'markdown')

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
          value={content}
          onValueChange={onContentChange}
          onKeyDown={onKeyDown}
          onCopy={onCopy}
          highlight={highlight}
          ignoreTabKey={!captureTab}
        />
      </EditorContainer>
    </>
  )
}

export default MarkdownEditor
