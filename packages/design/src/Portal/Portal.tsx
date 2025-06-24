import { logger } from '@repro/logger'
import React, { PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { usePortalRoot } from './PortalRootProvider'

export const Portal: React.FC<PropsWithChildren> = ({ children }) => {
  const root = usePortalRoot()

  if (!root) {
    logger.error('Portal: cannot find portal root element')
    return null
  }

  return createPortal(children, root)
}
