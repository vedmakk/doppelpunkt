import { css, Theme } from '@emotion/react'

export const focusVisibleStyles = ({ theme }: { theme: Theme }) =>
  css({
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary}`,
      outlineOffset: '2px',
      borderRadius: theme.spacing(0.25),
    },
  })

export const focusWithinStyles = ({ theme }: { theme: Theme }) =>
  css({
    '&:focus-within': {
      outline: `2px solid ${theme.colors.primary}`,
      outlineOffset: '2px',
      borderRadius: theme.spacing(0.25),
    },
  })
