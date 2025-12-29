import React, { useEffect, useRef, ReactNode, useReducer } from 'react'
import styled from '@emotion/styled'
import { keyframes, css } from '@emotion/react'

interface Props {
  /** The content to display */
  children: ReactNode
  /** Unique key to trigger re-animation when status changes */
  statusKey: string
  /** When true, the indicator stays visible and doesn't fade out */
  pinned?: boolean
  /** Duration in ms before fading out (default: 2000) */
  displayDuration?: number
}

const FADE_DURATION = 300

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

type VisibilityState = 'hidden' | 'appearing' | 'visible' | 'fading'

type Action =
  | { type: 'SHOW' }
  | { type: 'FADE_IN_COMPLETE' }
  | { type: 'START_FADE_OUT' }
  | { type: 'FADE_OUT_COMPLETE' }

const visibilityReducer = (
  state: VisibilityState,
  action: Action,
): VisibilityState => {
  switch (action.type) {
    case 'SHOW':
      return 'appearing'
    case 'FADE_IN_COMPLETE':
      return state === 'appearing' ? 'visible' : state
    case 'START_FADE_OUT':
      return state === 'visible' ? 'fading' : state
    case 'FADE_OUT_COMPLETE':
      return state === 'fading' ? 'hidden' : state
    default:
      return state
  }
}

const Container = styled.div<{ visibilityState: VisibilityState }>`
  ${({ visibilityState }) => {
    if (visibilityState === 'hidden') {
      return css`
        display: none;
      `
    }

    if (visibilityState === 'fading') {
      return css`
        animation: ${fadeOut} ${FADE_DURATION}ms ease-out forwards;
      `
    }

    if (visibilityState === 'appearing') {
      return css`
        animation: ${fadeIn} ${FADE_DURATION}ms ease-in forwards;
      `
    }

    // 'visible' state - no animation, fully opaque
    return css`
      opacity: 1;
    `
  }}
`

/**
 * A component that shows content transiently - appearing when status changes
 * and disappearing after a duration, unless pinned.
 *
 * Uses a state machine with states: hidden -> appearing -> visible -> fading -> hidden
 */
export const TransientStatusIndicator: React.FC<Props> = ({
  children,
  statusKey,
  pinned = false,
  displayDuration = 2000,
}) => {
  const [visibilityState, dispatch] = useReducer(
    visibilityReducer,
    pinned ? 'visible' : 'hidden',
  )
  const prevStatusKeyRef = useRef<string>(statusKey)
  const isInitialMount = useRef(true)

  // Handle status changes and pinned state
  useEffect(() => {
    const statusChanged = prevStatusKeyRef.current !== statusKey
    prevStatusKeyRef.current = statusKey

    // On initial mount, only show if pinned
    // On subsequent renders, show if status changed or pinned
    const shouldShow = isInitialMount.current ? pinned : statusChanged || pinned
    isInitialMount.current = false

    if (shouldShow && visibilityState === 'hidden') {
      dispatch({ type: 'SHOW' })
    }
  }, [statusKey, pinned, visibilityState])

  // Handle fade-in animation completion
  useEffect(() => {
    if (visibilityState !== 'appearing') return

    const timer = setTimeout(() => {
      dispatch({ type: 'FADE_IN_COMPLETE' })
    }, FADE_DURATION)

    return () => clearTimeout(timer)
  }, [visibilityState])

  // Handle auto-hide after display duration (when not pinned)
  useEffect(() => {
    if (visibilityState !== 'visible' || pinned) return

    const timer = setTimeout(() => {
      dispatch({ type: 'START_FADE_OUT' })
    }, displayDuration)

    return () => clearTimeout(timer)
  }, [visibilityState, pinned, displayDuration])

  // Handle fade-out animation completion
  useEffect(() => {
    if (visibilityState !== 'fading') return

    const timer = setTimeout(() => {
      dispatch({ type: 'FADE_OUT_COMPLETE' })
    }, FADE_DURATION)

    return () => clearTimeout(timer)
  }, [visibilityState])

  // When pinned becomes true while fading, go back to visible
  useEffect(() => {
    if (pinned && visibilityState === 'fading') {
      dispatch({ type: 'SHOW' })
    }
  }, [pinned, visibilityState])

  if (visibilityState === 'hidden') {
    return null
  }

  return <Container visibilityState={visibilityState}>{children}</Container>
}
