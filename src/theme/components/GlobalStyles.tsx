import React from 'react'
import { Global, Theme, Interpolation } from '@emotion/react'

import { fontVollkorn } from '../fonts'

const globalStyles: Interpolation<Theme> = {
  '*': {
    boxSizing: 'border-box',
  },
  body: {
    ...fontVollkorn,
    fontFamily: 'Vollkorn',
    margin: 0,
    padding: 0,
    WebKitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  img: {
    // Prevent text selection on images, as images could otherwiseget selected
    // sometimes when the user clicks near them on the page.
    userSelect: 'none',
  },
}

// At first we had these styles merged with "globalStyles", which caused
// a flickering effect on text elements when changing themes on mobile.
// Assuming this was because the CSS styles were entirely replaces via
// @emotion/react's Global component, causing the font-faces to be loaded
// again. By moving changing styles to a separate Global component, we
// can avoid this flickering effect because only the changing styles are
// re-injected.
const changingGlobalStyles: Interpolation<Theme> = (theme) => ({
  body: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    transition: `background-color ${theme.animations.transition}, color ${theme.animations.transition}`,
  },
})

export const GlobalStyles = () => (
  <>
    <Global styles={globalStyles} />
    <Global styles={changingGlobalStyles} />
  </>
)
