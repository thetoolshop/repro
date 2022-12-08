import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  value: number
}

export const NumberRenderer: React.FC<Props> = ({ value }) => (
  <InlineBlock whiteSpace="pre" color={colors.blue['700']}>
    {value}
  </InlineBlock>
)
