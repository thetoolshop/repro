import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

export const NullRenderer: React.FC = () => (
  <Block color={colors.slate['500']}>null</Block>
)
