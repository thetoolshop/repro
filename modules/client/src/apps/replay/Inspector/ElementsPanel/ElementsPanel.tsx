import { Block } from 'jsxstyle'
import React, { useEffect } from 'react'
import { useSnapshot } from '@/libs/playback'
import { NodeType, VTree } from '@/types/vdom'
import { useSetAtomValue } from '@/utils/state'
import { Node } from './Node'
import { $openNodes, $selectedNode } from './state'

const getBodyElementNodeId = (snapshot: VTree) => {
  for (const [id, node] of Object.entries(snapshot.nodes)) {
    if (node.type === NodeType.Element) {
      if (node.tagName === 'body') {
        return id
      }
    }
  }

  return null
}

export const ElementsPanel: React.FC = () => {
  const snapshot = useSnapshot()
  const setSelectedNode = useSetAtomValue($selectedNode)
  const setOpenNodes = useSetAtomValue($openNodes)

  useEffect(() => {
    if (snapshot) {
      const nodeIds = [snapshot.rootId]
      const bodyNodeId = getBodyElementNodeId(snapshot)
      
      if (bodyNodeId) {
        nodeIds.push(bodyNodeId)
      }

      setOpenNodes(nodeIds)
    } else {
      setOpenNodes([])
    }
  }, [setOpenNodes])

  useEffect(() => {
    const bodyNodeId = snapshot ? getBodyElementNodeId(snapshot) : null
    setSelectedNode(bodyNodeId ? [bodyNodeId, 'open'] : null)
  }, [setSelectedNode])

  return (
    <Block
      fontFamily="monospace"
      fontSize="1.2rem"
      lineHeight="1em"
      paddingV="1rem"
      userSelect="none"
    >
      {snapshot && <Node id={snapshot.rootId} level={0} />}
    </Block>
  )
}

