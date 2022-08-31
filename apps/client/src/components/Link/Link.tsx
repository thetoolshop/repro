import React, { PropsWithChildren } from 'react'
import { Inline } from 'jsxstyle'
import { colors } from '~/config/theme'

export const Link: React.FC<PropsWithChildren> = ({ children }) => (
  <Inline color={colors.pink['700']} textDecoration="underline">
    {children}
  </Inline>
)
