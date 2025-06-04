import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MenuState {
  readonly isOpen: boolean
  readonly shouldRender: boolean
}

const initialState: MenuState = {
  isOpen: false,
  shouldRender: false,
}

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    toggleMenu: (state) => {
      if (!state.isOpen) {
        return {
          ...state,
          isOpen: true,
          shouldRender: true,
        }
      } else {
        return {
          ...state,
          isOpen: false,
        }
      }
    },
    setShouldRender: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        shouldRender: action.payload,
      }
    },
    closeMenu: (state) => {
      return {
        ...state,
        isOpen: false,
      }
    },
  },
})

export const menuReducer = menuSlice.reducer
export const { toggleMenu, setShouldRender, closeMenu } = menuSlice.actions
