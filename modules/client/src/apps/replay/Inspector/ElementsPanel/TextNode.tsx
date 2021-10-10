import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { VText } from '@/types/vdom'

interface Props {
  node: VText
}

export const TextNode: React.FC<Props> = ({ node }) => (
  <Block color={colors.blueGray['700']}>{node.value}</Block>
)
