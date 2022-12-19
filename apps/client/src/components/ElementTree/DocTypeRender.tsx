import { SyntheticId, VDocType } from '@repro/domain'
import React from 'react'
import { DocTypeR } from '~/components/DOM'
import { useNode } from './context'
import { TreeRow } from './TreeRow'

interface Props {
  depth: number
  nodeId: SyntheticId
}

export const DocTypeNodeRenderer: React.FC<Props> = ({ nodeId, depth }) => {
  const node = useNode<VDocType>(nodeId)

  if (!node) {
    return null
  }

  return (
    <TreeRow nodeId={nodeId} key={nodeId} depth={depth}>
      <DocTypeR node={node} />
    </TreeRow>
  )
}
