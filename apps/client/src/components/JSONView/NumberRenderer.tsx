import { InlineFlex } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  data: number
}

export const NumberRenderer: React.FC<Props> = ({ data }) => (
  <InlineFlex color={colors.sky['700']}>{data}</InlineFlex>
)
