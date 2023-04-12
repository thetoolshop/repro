import React from 'react'
import { VTree } from '@repro/domain'
import { NodeRenderer } from './NodeRenderer'
import { VTreeContext } from './context'

interface Props {
  vtree: VTree
}

export const TreeRenderer: React.FC<Props> = ({ vtree }) => (
  <VTreeContext.Provider value={vtree}>
    <NodeRenderer nodeId={vtree.rootId} depth={0} />
  </VTreeContext.Provider>
)
