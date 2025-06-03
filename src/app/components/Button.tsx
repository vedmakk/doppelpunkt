import React from 'react'
import { Theme, Interpolation, CSSObject } from '@emotion/react'

import { Appear } from './Appear'

interface ButtonProps {
  label: string
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  href?: string
  externalLink?: boolean
  variant?: 'arrow' | 'text' | 'arrow-left' | 'arrow-top'
  size?: 'normal' | 'small' | 'tiny'
  active?: boolean
  disabled?: boolean
}

const buttonStyles = (theme: Theme, externalLink?: boolean): CSSObject => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  margin: 0,
  padding: 0,
  textDecoration: 'none',
  opacity: 1,
  willChange: 'transform, opacity',
  transition: `transform ${theme.animations.interaction}, opacity ${theme.animations.interaction}`,
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    transform: `${externalLink ? 'rotate(-45deg)' : ''}`,
    transition: `transform ${theme.animations.interaction}`,
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      willChange: 'transform',
      transform: 'unset',
      transition: `transform ${theme.animations.interaction}`,
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `translateX(${theme.spacing(1)}) ${externalLink ? 'rotate(-45deg)' : ''}`,
  },
  '&:not(:disabled) #label:hover, &.active #label': {
    textDecorationColor: theme.colors.primary,
  },
  ':disabled': {
    opacity: theme.opacity.disabled,
    cursor: 'not-allowed',
  },
  '@media (hover: hover) and (pointer: fine)': {
    [':active']: {
      transition: 'none',
      transform: `scale(${theme.interactions.activeScale})`,
      opacity: theme.interactions.activeOpacity,
    },
  },
  '@media (hover: none) and (pointer: coarse)': {
    ':active': {
      transition: 'none',
      transform: `scale(${theme.interactions.activeScale})`,
      opacity: theme.interactions.activeOpacity,
    },
  },
})

const arrowLeftStyles = (theme: Theme): CSSObject => ({
  ...buttonStyles(theme),
  flexDirection: 'row-reverse',
  '& > #arrow': {
    transform: 'rotate(180deg)',
  },
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    ...(buttonStyles(theme)[
      '&:not(:disabled) > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: 'rotate(180deg)',
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      ...(buttonStyles(theme)[
        '&:not(:disabled) > #arrow, &.active > #arrow'
      ] as CSSObject),
      transform: 'rotate(180deg)',
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `rotate(180deg) translateX(${theme.spacing(1)})`,
  },
})

const arrowTopStyles = (theme: Theme): CSSObject => ({
  ...buttonStyles(theme),
  '& > #arrow': {
    transform: 'rotate(-90deg)',
  },
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    ...(buttonStyles(theme)[
      '&:not(:disabled) > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: 'rotate(-90deg)',
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      ...(buttonStyles(theme)[
        '&:not(:disabled) > #arrow, &.active > #arrow'
      ] as CSSObject),
      transform: 'rotate(-90deg)',
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `rotate(-90deg) translateX(${theme.spacing(1)})`,
  },
})

const smallButtonStyles = (
  theme: Theme,
  externalLink?: boolean,
): CSSObject => ({
  ...buttonStyles(theme, externalLink),
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    ...(buttonStyles(theme)[
      '&:not(:disabled):hover > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: `translateX(${theme.spacing(0.5)}) ${externalLink ? 'rotate(-45deg)' : ''}`,
  },
})

const smallArrowLeftStyles = (theme: Theme): CSSObject => ({
  ...smallButtonStyles(theme),
  flexDirection: 'row-reverse',
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    ...(smallButtonStyles(theme)[
      '&:not(:disabled) > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: 'rotate(180deg)',
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      ...(buttonStyles(theme)[
        '&:not(:disabled) > #arrow, &.active > #arrow'
      ] as CSSObject),
      transform: 'rotate(180deg)',
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `rotate(180deg) translateX(${theme.spacing(0.5)})`,
  },
})

const smallArrowTopStyles = (theme: Theme): CSSObject => ({
  ...smallButtonStyles(theme),
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    ...(smallButtonStyles(theme)[
      '&:not(:disabled) > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: 'rotate(-90deg)',
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      ...(buttonStyles(theme)[
        '&:not(:disabled) > #arrow, &.active > #arrow'
      ] as CSSObject),
      transform: 'rotate(-90deg)',
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `rotate(-90deg) translateX(${theme.spacing(0.5)})`,
  },
})

const tinyButtonStyles = (theme: Theme, externalLink?: boolean): CSSObject => ({
  ...buttonStyles(theme, externalLink),
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    ...(buttonStyles(theme)[
      '&:not(:disabled):hover > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: `translateX(${theme.spacing(0.25)}) ${externalLink ? 'rotate(-45deg)' : ''}`,
  },
})

const tinyArrowLeftStyles = (theme: Theme): CSSObject => ({
  ...tinyButtonStyles(theme),
  flexDirection: 'row-reverse',
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    ...(tinyButtonStyles(theme)[
      '&:not(:disabled) > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: 'rotate(180deg)',
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      ...(tinyButtonStyles(theme)[
        '&:not(:disabled) > #arrow, &.active > #arrow'
      ] as CSSObject),
      transform: 'rotate(180deg)',
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `rotate(180deg) translateX(${theme.spacing(0.25)})`,
  },
})

const tinyArrowTopStyles = (theme: Theme): CSSObject => ({
  ...tinyButtonStyles(theme),
  '&:not(:disabled) > #arrow, &.active > #arrow': {
    ...(tinyButtonStyles(theme)[
      '&:not(:disabled) > #arrow, &.active > #arrow'
    ] as CSSObject),
    transform: 'rotate(-90deg)',
  },
  [theme.breakpoints.md]: {
    '&:not(:disabled) > #arrow, &.active > #arrow': {
      ...(tinyButtonStyles(theme)[
        '&:not(:disabled) > #arrow, &.active > #arrow'
      ] as CSSObject),
      transform: 'rotate(-90deg)',
    },
  },
  '&:not(:disabled):hover > #arrow, &.active > #arrow': {
    willChange: 'transform',
    transform: `rotate(-90deg) translateX(${theme.spacing(0.25)})`,
  },
})

const labelStyles = (theme: Theme): CSSObject => ({
  color: theme.colors.link,
  fontFamily: 'Vollkorn',
  fontSize: '28px',
  fontStyle: 'normal',
  fontWeight: 500,
  lineHeight: 'normal',
  textAlign: 'left',
  textDecoration: 'underline',
  textDecorationThickness: '3px',
  textDecorationColor: theme.colors.text,
  transition: `text-decoration-color ${theme.animations.interaction}, color ${theme.animations.transition}`,
})

const arrowStyles = (theme: Theme) => ({
  width: '48px',
  color: theme.colors.primary,
  lineHeight: 1,
})

const smallLabelStyles: Interpolation<Theme> = (theme: Theme) => ({
  ...labelStyles(theme),
  fontSize: '18px',
  textDecorationThickness: '2px',
})

const smallArrowStyles: Interpolation<Theme> = (theme) => ({
  ...arrowStyles(theme),
  width: '24px',
  lineHeight: 1,
})

// tiny variant: uses tiny label size and smaller arrow
const tinyLabelStyles: Interpolation<Theme> = (theme: Theme) => ({
  ...labelStyles(theme),
  fontSize: '14px',
  textDecorationThickness: '1px',
})

const tinyArrowStyles: Interpolation<Theme> = (theme) => ({
  ...arrowStyles(theme),
  width: '16px',
  lineHeight: 1,
})

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  href,
  externalLink = false,
  variant = 'arrow',
  size = 'normal',
  disabled = false,
  active = false,
}) => {
  const buttonStyle =
    variant === 'arrow-left'
      ? size === 'tiny'
        ? tinyArrowLeftStyles
        : size === 'small'
          ? smallArrowLeftStyles
          : arrowLeftStyles
      : variant === 'arrow-top'
        ? size === 'tiny'
          ? tinyArrowTopStyles
          : size === 'small'
            ? smallArrowTopStyles
            : arrowTopStyles
        : size === 'tiny'
          ? tinyButtonStyles
          : buttonStyles

  const componentChildren = (
    <>
      <Appear selector="& > span">
        <span
          key={label}
          id="label"
          css={
            size === 'tiny'
              ? tinyLabelStyles
              : size === 'small'
                ? smallLabelStyles
                : labelStyles
          }
        >
          {label}
        </span>
      </Appear>
      {(variant === 'arrow' ||
        variant === 'arrow-left' ||
        variant === 'arrow-top') && (
        <div
          id="arrow"
          css={
            size === 'tiny'
              ? tinyArrowStyles
              : size === 'small'
                ? smallArrowStyles
                : arrowStyles
          }
        >
          {size === 'tiny' ? (
            // Tiny arrow
            <svg
              width="17"
              height="8"
              viewBox="0 0 17 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.3536 4.35355C16.5488 4.15829 16.5488 3.84171 16.3536 3.64645L13.1716 0.464466C12.9763 0.269204 12.6597 0.269204 12.4645 0.464466C12.2692 0.659728 12.2692 0.976311 12.4645 1.17157L15.2929 4L12.4645 6.82843C12.2692 7.02369 12.2692 7.34027 12.4645 7.53553C12.6597 7.7308 12.9763 7.7308 13.1716 7.53553L16.3536 4.35355ZM0 4V4.5H16V4V3.5H0V4Z"
                fill="currentColor"
              />
            </svg>
          ) : size === 'small' ? (
            // Exported from Figma
            <svg
              width="25"
              height="15"
              viewBox="0 0 25 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                id="Arrow"
                d="M24.7071 8.20711C25.0976 7.81658 25.0976 7.18342 24.7071 6.79289L18.3431 0.428932C17.9526 0.0384078 17.3195 0.0384078 16.9289 0.428932C16.5384 0.819457 16.5384 1.45262 16.9289 1.84315L22.5858 7.5L16.9289 13.1569C16.5384 13.5474 16.5384 14.1805 16.9289 14.5711C17.3195 14.9616 17.9526 14.9616 18.3431 14.5711L24.7071 8.20711ZM0 8.5H24V6.5H0V8.5Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            // Exported from Figma
            <svg
              width="50"
              height="23"
              viewBox="0 0 50 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                id="Arrow"
                d="M49.0607 12.5607C49.6464 11.9749 49.6464 11.0251 49.0607 10.4393L39.5147 0.893398C38.9289 0.307611 37.9792 0.307611 37.3934 0.893398C36.8076 1.47919 36.8076 2.42893 37.3934 3.01472L45.8787 11.5L37.3934 19.9853C36.8076 20.5711 36.8076 21.5208 37.3934 22.1066C37.9792 22.6924 38.9289 22.6924 39.5147 22.1066L49.0607 12.5607ZM0 13H48V10H0V13Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
      )}
    </>
  )

  return (
    <Appear>
      {href ? (
        <a
          href={href}
          css={(theme) => buttonStyle(theme, externalLink)}
          role="button"
          className={active ? 'active' : undefined}
          target={externalLink ? '_blank' : undefined}
          rel={externalLink ? 'noreferrer' : undefined}
        >
          {componentChildren}
        </a>
      ) : (
        <button
          css={buttonStyle}
          onClick={onClick}
          disabled={disabled}
          className={active ? 'active' : undefined}
        >
          {componentChildren}
        </button>
      )}
    </Appear>
  )
}
