import { Block } from 'jsxstyle'
import React from 'react'

export const FullWidthViewport: React.FC = ({ children }) => (
  <Block width="100%" height="100%">
    {children}
  </Block>
)
