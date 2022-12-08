import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

export const NullRenderer: React.FC = () => (
  <InlineBlock color={colors.red['700']}>null</InlineBlock>
)
