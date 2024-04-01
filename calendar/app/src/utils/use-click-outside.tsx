import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
/**
 * Hook for checking when the user clicks outside the passed ref
 */
export function useClickOutside ({
  ref,
  callback,
  enabled
}: {
  ref: RefObject<any>
  callback: () => void
  enabled: boolean
}): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  useEffect(() => {
    if (!enabled) {
      return
    }

    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside (event: MouseEvent): void {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (ref.current && !ref.current.contains(event.target)) {
        callbackRef.current()
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, enabled])
}
