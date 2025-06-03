import React from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import styled from '@emotion/styled'

import { useDispatch, useSelector } from 'react-redux'

import { RootState } from '../store'

import { setText } from '../features/editorSlice'

import 'prismjs/components/prism-markdown'
//import 'prismjs/themes/prism-tomorrow.css';

const EditorContainer = styled.div`
  position: relative;
  flex: 1;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  line-height: 1.5;
`

const CodeEditor = styled(Editor)`
  background: #fff;
  max-width: 794px; /* A4 width at 96dpi: 210mm ≈ 794px */
  min-height: calc(100vh - 50px);
  margin: 0 auto;
  white-space: pre-wrap;
  & textarea {
    outline: none;
  }
`

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
      />
    </EditorContainer>
  )
}

export default MarkdownEditor
