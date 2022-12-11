import { InlineFlex } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

export const NullRenderer: React.FC = () => (
  <InlineFlex color={colors.slate['700']}>null</InlineFlex>
)
