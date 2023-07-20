import { SyntheticId, VDocument } from '@repro/domain'
import { Block } from 'jsxstyle'
import React, { useContext } from 'react'
import { DocumentR } from '../DOM'
import { useNode, useNodeVisibility, VTreeContext } from './context'
import { NodeRenderer } from './NodeRenderer'
import { Toggle } from './Toggle'
import { TreeRow } from './TreeRow'

interface Props {
  nodeId: SyntheticId
  depth: number
}

export const DocumentNodeRenderer: React.FC<Props> = ({ nodeId, depth }) => {
  const vtree = useContext(VTreeContext)
  const node = useNode<VDocument>(nodeId)
  const { isVisible, onToggleNodeVisibility } = useNodeVisibility(nodeId)

  if (!vtree || !node) {
    return null
  }

  const isRootNode = nodeId === vtree.rootId
  const hasChildren = node.children.length > 0

  const children = isVisible && (
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
      <TreeRow nodeId={nodeId} depth={depth}>
        {hasChildren && (
          <Toggle isOpen={isVisible} onClick={onToggleNodeVisibility} />
        )}
        <DocumentR />
      </TreeRow>
      {children}
    </Block>
  )
}
