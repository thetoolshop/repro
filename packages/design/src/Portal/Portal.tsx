import React, { PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { usePortalRoot } from './PortalRootProvider'

export const Portal: React.FC<PropsWithChildren> = ({ children }) => {
  const root = usePortalRoot()

  if (!root) {
    throw new Error('Portal: cannot find portal root element')
  }

  return createPortal(children, root)
}
