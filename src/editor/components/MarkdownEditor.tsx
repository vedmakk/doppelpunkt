import React from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import styled from '@emotion/styled'

import { useDispatch, useSelector } from 'react-redux'

import { RootState } from '../../store'

import { setText } from '../editorSlice'

import 'prismjs/components/prism-markdown'
//import 'prismjs/themes/prism-tomorrow.css';

const EditorContainer = styled.div(({ theme }) => ({
  position: 'relative',
  flex: 1,
  overflow: 'auto',
  fontFamily: 'Courier New, Courier, monospace',
  fontSize: '16px',
  lineHeight: '1.5',
  backgroundColor: theme.colors.backdrop,
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
}))

const CodeEditor = styled(Editor)(({ theme }) => ({
  background: theme.colors.background,
  maxWidth: '794px', // A4 width at 96dpi: 210mm ≈ 794px
  minHeight: `calc(100vh - 65px - 2*${theme.spacing(4)})`,
  margin: `${theme.spacing(4)} auto`,
  transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
  whiteSpace: 'pre-wrap',
  '& textarea': {
    outline: 'none',
  },
}))

const MarkdownEditor: React.FC = () => {
  const dispatch = useDispatch()
  const content = useSelector((state: RootState) => state.editor.present)

  const highlight = (code: string) =>
    Prism.highlight(code, Prism.languages.markdown, 'markdown')

  return (
    <EditorContainer className="editor-container">
      <CodeEditor
        className="code-editor"
        value={content}
        onValueChange={(value) => dispatch(setText(value))}
        highlight={highlight}
        padding={75} // 20mm at 96dpi
        autoFocus
      />
    </EditorContainer>
  )
}

export default MarkdownEditor
