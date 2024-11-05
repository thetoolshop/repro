import { NodeType, SyntheticId, VElement } from '@repro/domain'
import { isEmptyElementVNode, isParentVNode } from '@repro/vdom-utils'
import { Block } from 'jsxstyle'
import React, { useContext } from 'react'
import { ElementR } from '../DOM'
import { NodeRenderer } from './NodeRenderer'
import { Toggle } from './Toggle'
import { TreeRow } from './TreeRow'
import { VTreeContext, useNode, useNodeVisibility } from './context'

interface Props {
  depth: number
  nodeId: SyntheticId
}

export const ElementNodeRenderer: React.FC<Props> = ({ nodeId, depth }) => {
  const vtree = useContext(VTreeContext)
  const node = useNode(nodeId)
  const { isVisible, onToggleNodeVisibility } = useNodeVisibility(nodeId)

  if (!vtree || !node) {
    return null
  }

  const hasChildren = node
    .filter<VElement>(node => node.type === NodeType.Element)
    .match(node => node.children.length > 0)

  const isEmptyElement = isEmptyElementVNode(node)

  const rootNode = vtree.nodes[vtree.rootId]
  const isTopLevelNode =
    rootNode &&
    isParentVNode(rootNode) &&
    rootNode.match(rootNode => rootNode.children.includes(nodeId))

  return node
    .filter<VElement>(node => node.type === NodeType.Element)
    .map(node => {
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
                <NodeRenderer
                  key={childId}
                  nodeId={childId}
                  depth={depth + 1}
                />
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
    })
    .orElse(null)
}
