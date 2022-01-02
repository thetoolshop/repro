import { Block } from 'jsxstyle'
import React from 'react'
import { SyntheticId } from '@/types/common'
import { VDocument } from '@/types/vdom'
import { useContext } from 'react'
import { VTreeContext, useNodeState, useNode } from './context'
import { Toggle } from './Toggle'
import { TreeRow } from './TreeRow'
import { NodeRenderer } from './NodeRenderer'

interface Props {
  nodeId: SyntheticId
  depth: number
}

export const DocumentNodeRenderer: React.FC<Props> = ({ nodeId, depth }) => {
  const vtree = useContext(VTreeContext)
  const node = useNode<VDocument>(nodeId)
  const [targetNodeId, isOpen, toggleNode] = useNodeState(nodeId)

  if (!vtree || !node) {
    return null
  }

  const isRootNode = nodeId === vtree.rootId
  const hasChildren = node.children.length > 0

  const children = isOpen && (
    <Block>
      {node.children.map(childId => (
        <NodeRenderer
          key={childId}
          nodeId={childId}
          depth={isRootNode ? depth : depth + 1}
        />
      ))}
    </Block>
  )

  if (nodeId === vtree.rootId) {
    return <React.Fragment>{children}</React.Fragment>
  }

  return (
    <Block key={nodeId}>
      <TreeRow highlight={nodeId === targetNodeId} depth={depth}>
        {hasChildren && <Toggle isOpen={isOpen} onClick={toggleNode} />}
      </TreeRow>
      {children}
    </Block>
  )
}
