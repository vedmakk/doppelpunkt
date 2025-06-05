import { useAppSelector } from '../store'

import { selectIsMenuOpen, selectShouldRenderMenu } from './selectors'

export const useIsMenuOpen = () => useAppSelector(selectIsMenuOpen)

export const useShouldRenderMenu = () => useAppSelector(selectShouldRenderMenu)
