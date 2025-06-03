import React from 'react'
import { Theme, CSSObject } from '@emotion/react'

interface LabelProps {
  children: React.ReactNode
  size?: 'normal' | 'small' | 'tiny'
  customCss?: (theme: Theme) => CSSObject
}

const labelStyles = (theme: Theme): CSSObject => ({
  color: theme.colors.link,
  fontFamily: 'Vollkorn',
  fontSize: '28px',
  fontStyle: 'normal',
  fontWeight: 500,
  lineHeight: 'normal',
  textAlign: 'left',
  transition: `color ${theme.animations.transition}`,
})

const smallLabelStyles = (theme: Theme): CSSObject => ({
  ...labelStyles(theme),
  fontSize: '18px',
})

const tinyLabelStyles = (theme: Theme): CSSObject => ({
  ...labelStyles(theme),
  fontSize: '14px',
})

export const Label: React.FC<LabelProps> = ({
  children,
  size = 'normal',
  customCss,
}) => {
  const styles =
    size === 'normal'
      ? labelStyles
      : size === 'small'
        ? smallLabelStyles
        : tinyLabelStyles
  return <span css={[styles, customCss]}>{children}</span>
}
