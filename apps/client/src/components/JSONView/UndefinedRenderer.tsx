import { InlineFlex } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

export const UndefinedRenderer: React.FC = () => (
  <InlineFlex color={colors.slate['500']}>undefined</InlineFlex>
)
