import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { PORTAL_ROOT_ID } from './constants'

export const Portal: React.FC<PropsWithChildren> = ({ children }) => {
  const container = useMemo(() => document.createElement('div'), [])

  useEffect(() => {
    const root = document.getElementById(PORTAL_ROOT_ID)

    if (root) {
      root.appendChild(container)
    }

    return () => {
      if (root) {
        root.removeChild(container)
      }
    }
  }, [container])

  return createPortal(children, container)
}
