import { SyntheticId, VText } from '@repro/domain'
import { Inline, InlineBlock } from 'jsxstyle'
import React from 'react'
import colors from 'tailwindcss/colors'
import { FONT_SIZE } from './constants'
import { useNode } from './context'
import { TreeRow } from './TreeRow'

interface Props {
  depth: number
  nodeId: SyntheticId
}

export const TextNodeRenderer: React.FC<Props> = ({ depth, nodeId }) => {
  const node = useNode<VText>(nodeId)

  if (!node) {
    return null
  }

  // TODO: only filter out empty text nodes between block-level elements
  if (/^\s*$/.test(node.value)) {
    return null
  }

  return (
    <InlineBlock key={nodeId}>
      <TreeRow nodeId={nodeId} depth={depth}>
        <Inline
          fontFamily="monospace"
          fontSize={FONT_SIZE}
          lineHeight={1.5}
          color={colors.slate['700']}
        >
          {node.value}
        </Inline>
      </TreeRow>
    </InlineBlock>
  )
}
