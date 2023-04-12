import { SyntheticId, VElement } from '@repro/domain'
import { isEmptyElementVNode } from '@repro/vdom-utils'
import { Block } from 'jsxstyle'
import React, { useContext } from 'react'
import { ElementR } from '../DOM'
import { useNode, useNodeVisibility, VTreeContext } from './context'
import { NodeRenderer } from './NodeRenderer'
import { Toggle } from './Toggle'
import { TreeRow } from './TreeRow'

interface Props {
  depth: number
  nodeId: SyntheticId
}

export const ElementNodeRenderer: React.FC<Props> = ({ nodeId, depth }) => {
  const vtree = useContext(VTreeContext)
  const node = useNode<VElement>(nodeId)
  const { isVisible, onToggleNodeVisibility } = useNodeVisibility(nodeId)

  if (!vtree || !node) {
    return null
  }

  const hasChildren = node.children.length > 0
  const rootNode = vtree.nodes[vtree.rootId]
  const isTopLevelNode =
    rootNode && 'children' in rootNode && rootNode.children.includes(nodeId)
  const isEmptyElement = isEmptyElementVNode(node)

  return (
    <Block key={nodeId}>
      <TreeRow nodeId={nodeId} depth={depth} tag="open">
        {!isTopLevelNode && hasChildren && (
          <Toggle isOpen={isVisible} onClick={onToggleNodeVisibility} />
        )}

        <ElementR.Open node={node} />

        {!isEmptyElement && !isVisible && <ElementR.Close node={node} />}
      </TreeRow>

      {!isEmptyElement && isVisible && (
        <Block>
          {node.children.map(childId => (
            <NodeRenderer key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </Block>
      )}

      {!isEmptyElement && isVisible && (
        <TreeRow nodeId={nodeId} depth={depth} tag="close">
          <ElementR.Close node={node} />
        </TreeRow>
      )}
    </Block>
  )
}
