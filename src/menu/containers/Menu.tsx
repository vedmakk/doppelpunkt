import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { toggleMenu, closeMenu, setShouldRender } from '../menuSlice'

import { useIsMenuOpen, useShouldRenderMenu } from '../hooks'

import MenuComponent from '../components/Menu'

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
