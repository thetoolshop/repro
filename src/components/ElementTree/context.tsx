import { SyntheticId } from '@/types/common'
import { VNode, VTree } from '@/types/vdom'
import React, { useCallback, useContext } from 'react'

export const VTreeContext = React.createContext<VTree | null>(null)

export const NodeStateContext = React.createContext<
  [SyntheticId | null, Set<SyntheticId>, (nodeId: SyntheticId) => void]
>([null, new Set(), () => {}])

export function useNode<T extends VNode = VNode>(nodeId: SyntheticId) {
  const vtree = useContext(VTreeContext)

  if (!vtree) {
    return null
  }

  return (vtree.nodes[nodeId] as T) || null
}

export function useNodeState(nodeId: SyntheticId) {
  const [targetNodeId, openNodes, toggleNode] = useContext(NodeStateContext)

  return [
    targetNodeId,
    openNodes.has(nodeId),
    useCallback(() => toggleNode(nodeId), [nodeId, toggleNode]),
  ] as const
}
