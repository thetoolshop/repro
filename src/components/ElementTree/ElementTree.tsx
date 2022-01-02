import { SyntheticId } from '@/types/common'
import { VTree } from '@/types/vdom'
import { isDocumentVNode, isElementVNode } from '@/utils/vdom'
import { Block } from 'jsxstyle'
import React, { useCallback, useState } from 'react'
import { NodeStateContext } from './context'
import { TreeRenderer } from './TreeRenderer'

interface Props {
  targetNodeId: SyntheticId | null
  vtree: VTree
}

export const ElementTree: React.FC<Props> = ({ targetNodeId, vtree }) => {
  const [openNodes, setOpenNodes] = useState(() => {
    const initialOpenNodes = []

    // TODO: add materialized path for target node to open nodes
    // TODO: set body element as initial target node if not set
    initialOpenNodes.push(vtree.rootId)

    const rootNode = vtree.nodes[vtree.rootId]

    if (rootNode && isDocumentVNode(rootNode)) {
      const documentElementNode = rootNode.children
        .map(childId => vtree.nodes[childId])
        .find(
          childNode =>
            childNode &&
            isElementVNode(childNode) &&
            childNode.tagName === 'html'
        )

      if (documentElementNode && isElementVNode(documentElementNode)) {
        initialOpenNodes.push(documentElementNode.id)

        const bodyNode = documentElementNode.children
          .map(childId => vtree.nodes[childId])
          .find(
            childNode =>
              childNode &&
              isElementVNode(childNode) &&
              childNode.tagName === 'body'
          )

        if (bodyNode) {
          initialOpenNodes.push(bodyNode.id)
        }
      }
    }

    return new Set<SyntheticId>(initialOpenNodes)
  })

  const toggleNode = useCallback(
    (nodeId: SyntheticId) =>
      setOpenNodes(openNodes => {
        const nextOpenNodes = new Set(openNodes)

        if (nextOpenNodes.has(nodeId)) {
          nextOpenNodes.delete(nodeId)
        } else {
          nextOpenNodes.add(nodeId)
        }

        return nextOpenNodes
      }),
    [setOpenNodes]
  )

  return (
    <NodeStateContext.Provider value={[targetNodeId, openNodes, toggleNode]}>
      <Block paddingV={8}>
        <TreeRenderer vtree={vtree} />
      </Block>
    </NodeStateContext.Provider>
  )
}
