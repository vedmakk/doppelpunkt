import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { toggleMenu, openMenu, closeMenu, setShouldRender } from '../menuSlice'

import { useIsMenuOpen, useShouldRenderMenu } from '../hooks'
import { useEscapeKey } from '../../shared/hooks'
import { useFullMenuWidth } from '../../theme/hooks'

import MenuComponent from '../components/Menu'

const Menu: React.FC = () => {
  const isMenuOpen = useIsMenuOpen()
  const shouldRenderMenu = useShouldRenderMenu()
  const isFullMenuWidth = useFullMenuWidth()

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

  useEscapeKey(handleCloseMenu)

  // Initially open the menu if the screen is wide enough
  useEffect(() => {
    if (isFullMenuWidth) {
      dispatch(openMenu())
    }
  }, [dispatch, isFullMenuWidth])

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
