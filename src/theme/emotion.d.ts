import '@emotion/react'

import { CustomTheme } from './selectors'
import { Theme as EmotionTheme } from '@emotion/react'

declare module '@emotion/react' {
  export interface Theme extends EmotionTheme, CustomTheme {}
}
