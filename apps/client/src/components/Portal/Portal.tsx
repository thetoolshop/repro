import React, { PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { PORTAL_ROOT_ID } from './constants'

export const Portal: React.FC<PropsWithChildren> = ({ children }) =>
  createPortal(children, document.getElementById(PORTAL_ROOT_ID) as HTMLElement)
