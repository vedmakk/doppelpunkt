import React from 'react'
import { Global, Theme, CSSObject } from '@emotion/react'

const printStyles = (theme: Theme): CSSObject => ({
  '@page': {
    // margin: '20mm',
    margin: '0',
  },
  '@media print': {
    body: {
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact',
    },
    '#toolbar': {
      display: 'none',
    },
    'html, body, #root > div, .editor-container, .code-editor': {
      maxWidth: 'auto !important',
      height: 'auto !important',
      minHeight: 'auto !important',
      overflow: 'visible !important',
      background: `${theme.colors.background} !important`,
      color: theme.colors.text,
      '& > pre': {
        padding: '0 !important',
      },
    },
    '.code-editor': {
      margin: '0 !important',
      padding: '20mm !important',
    },
  },
})

export const PrintStyles = () => (
  <>
    <Global styles={printStyles} />
  </>
)
