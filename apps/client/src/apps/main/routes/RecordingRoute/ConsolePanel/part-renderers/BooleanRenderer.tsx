import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  value: boolean
}

export const BooleanRenderer: React.FC<Props> = ({ value }) => (
  <InlineBlock whiteSpace="pre" color={colors.emerald['700']}>
    {value}
  </InlineBlock>
)
