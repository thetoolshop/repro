import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

export const UndefinedRenderer: React.FC = () => (
  <Block color={colors.slate['500']}>undefined</Block>
)
