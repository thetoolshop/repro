import { InlineFlex } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  data: boolean
}

export const BooleanRenderer: React.FC<Props> = ({ data }) => (
  <InlineFlex color={colors.teal['700']}>{data ? 'true' : 'false'}</InlineFlex>
)
