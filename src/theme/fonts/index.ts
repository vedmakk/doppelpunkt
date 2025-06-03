import VollkornRegularWoff2 from './woff2/Vollkorn-Regular.woff2'
import VollkornMediumWoff2 from './woff2/Vollkorn-Medium.woff2'
import VollkornSemiBoldWoff2 from './woff2/Vollkorn-SemiBold.woff2'

export const fontVollkorn = [
  {
    '@font-face': {
      fontFamily: 'Vollkorn',
      src: `url(${VollkornRegularWoff2}) format('woff2')`,
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  },
  {
    '@font-face': {
      fontFamily: 'Vollkorn',
      src: `url(${VollkornMediumWoff2}) format('woff2')`,
      fontWeight: 500,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  },
  {
    '@font-face': {
      fontFamily: 'Vollkorn',
      src: `url(${VollkornSemiBoldWoff2}) format('woff2')`,
      fontWeight: 600,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    },
  },
]
