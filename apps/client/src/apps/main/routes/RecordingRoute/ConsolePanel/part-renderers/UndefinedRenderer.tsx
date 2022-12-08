import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

export const UndefinedRenderer: React.FC = () => (
  <InlineBlock color={colors.slate['500']}>undefined</InlineBlock>
)
