import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  data: string
  color?: string
}

const DEFAULT_COLOR = colors.slate['700']

export const StringRenderer: React.FC<Props> = ({
  data,
  color = DEFAULT_COLOR,
}) => <Block color={color}>{data}</Block>
