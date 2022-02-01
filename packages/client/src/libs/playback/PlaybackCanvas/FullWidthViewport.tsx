import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'

export const FullWidthViewport: React.FC = ({ children }) => (
  <Block width="100%" height="100%" background={colors.white}>
    {children}
  </Block>
)
