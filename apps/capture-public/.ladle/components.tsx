import type { GlobalProvider } from '@ladle/react'
import { Block } from 'jsxstyle'
import React from 'react'

export const Provider: GlobalProvider = ({ children }) => (
  <Block height="100%">{children}</Block>
)
