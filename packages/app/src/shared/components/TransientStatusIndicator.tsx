import React, { useEffect, useState, useRef, ReactNode } from 'react'
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

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

const Container = styled.div<{ isVisible: boolean; isFadingOut: boolean }>`
  ${({ isVisible, isFadingOut }) => {
    if (!isVisible && !isFadingOut) {
      return css`
        display: none;
      `
    }

    if (isFadingOut) {
      return css`
        animation: ${fadeOut} 300ms ease-out forwards;
      `
    }

    return css`
      animation: ${fadeIn} 300ms ease-in forwards;
    `
  }}
`

/**
 * A component that shows content transiently - appearing when status changes
 * and disappearing after a duration, unless pinned.
 */
export const TransientStatusIndicator: React.FC<Props> = ({
  children,
  statusKey,
  pinned = false,
  displayDuration = 2000,
}) => {
  const [isVisible, setIsVisible] = useState(pinned)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevStatusKeyRef = useRef<string>(statusKey)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }

    const statusChanged = prevStatusKeyRef.current !== statusKey
    prevStatusKeyRef.current = statusKey

    // On initial mount, only show if pinned
    // On subsequent renders, show if status changed or pinned
    const shouldShow = isInitialMount.current ? pinned : statusChanged || pinned
    isInitialMount.current = false

    if (shouldShow) {
      setIsFadingOut(false)
      setIsVisible(true)

      if (!pinned) {
        // Start fade out timer
        timeoutRef.current = setTimeout(() => {
          setIsFadingOut(true)
          // Hide completely after fade animation
          fadeTimeoutRef.current = setTimeout(() => {
            setIsVisible(false)
            setIsFadingOut(false)
          }, 300)
        }, displayDuration)
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
    }
  }, [statusKey, pinned, displayDuration])

  // When pinned changes from true to false, start the fade timer
  useEffect(() => {
    if (!pinned && isVisible && !isFadingOut) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsFadingOut(true)
        fadeTimeoutRef.current = setTimeout(() => {
          setIsVisible(false)
          setIsFadingOut(false)
        }, 300)
      }, displayDuration)
    }
  }, [pinned, isVisible, isFadingOut, displayDuration])

  if (!isVisible && !isFadingOut) {
    return null
  }

  return (
    <Container isVisible={isVisible} isFadingOut={isFadingOut}>
      {children}
    </Container>
  )
}
