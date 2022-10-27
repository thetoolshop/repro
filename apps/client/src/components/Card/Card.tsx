import { Block } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { colors } from '~/config/theme'

export const Card: React.FC<PropsWithChildren> = ({ children }) => (
  <Block
    padding={20}
    backgroundColor={colors.white}
    borderRadius={4}
    boxShadow={`
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1)
    `}
  >
    {children}
  </Block>
)
