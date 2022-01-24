import { SyntheticId } from '@/types/common'
import { VText } from '@/types/vdom'
import { InlineBlock } from 'jsxstyle'
import React from 'react'
import colors from 'tailwindcss/colors'
import { FONT_SIZE } from './constants'
import { useNode } from './context'

interface Props {
  depth: number
  nodeId: SyntheticId
}

export const TextNodeRenderer: React.FC<Props> = ({ nodeId }) => {
  const node = useNode<VText>(nodeId)

  if (!node) {
    return null
  }

  // TODO: only filter out empty text nodes between block-level elements
  if (/^\s*$/.test(node.value)) {
    return null
  }

  return (
    <InlineBlock
      key={nodeId}
      fontFamily="monospace"
      fontSize={FONT_SIZE}
      lineHeight={1.5}
      color={colors.slate['700']}
    >
      {node.value}
    </InlineBlock>
  )
}
