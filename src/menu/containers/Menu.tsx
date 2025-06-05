import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { toggleMenu, openMenu, closeMenu, setShouldRender } from '../menuSlice'

import { useIsMenuOpen, useShouldRenderMenu } from '../hooks'

import MenuComponent from '../components/Menu'

import { TOOLBAR_BREAKPOINT } from '../../theme/selectors'

const Menu: React.FC = () => {
  const isMenuOpen = useIsMenuOpen()
  const shouldRenderMenu = useShouldRenderMenu()

  const dispatch = useDispatch()

  const handleToggleMenu = useCallback(() => {
    dispatch(toggleMenu())
  }, [dispatch])

  const setShouldRenderMenu = useCallback(
    (shouldRender: boolean) => {
      dispatch(setShouldRender(shouldRender))
    },
    [dispatch],
  )

  const handleCloseMenu = useCallback(() => {
    dispatch(closeMenu())
  }, [dispatch])

  // Initially open the menu if the screen is wide enough
  useEffect(() => {
    const isWideEnough = window.matchMedia(
      `(min-width: ${TOOLBAR_BREAKPOINT}px)`,
    ).matches

    if (isWideEnough) {
      dispatch(openMenu())
    }
  }, [dispatch])

  return (
    <MenuComponent
      isOpen={isMenuOpen}
      shouldRender={shouldRenderMenu}
      toggleMenu={handleToggleMenu}
      closeMenu={handleCloseMenu}
      setShouldRender={setShouldRenderMenu}
    />
  )
}

export default Menu
