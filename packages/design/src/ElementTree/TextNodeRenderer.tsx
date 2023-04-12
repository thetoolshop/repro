import { SyntheticId, VText } from '@repro/domain'
import React from 'react'
import { TextR } from '../DOM'
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
    <TreeRow nodeId={nodeId} depth={depth}>
      <TextR node={node} />
    </TreeRow>
  )
}
