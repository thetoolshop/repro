import { SyntheticId, VNode, VTree } from '@repro/domain'
import React, { useCallback, useContext } from 'react'

export const VTreeContext = React.createContext<VTree | null>(null)

export type Tag = 'open' | 'close'

export interface NodeState {
  focusedNode: SyntheticId | null
  focusedNodeTag: Tag
  onFocusNode: (nodeId: SyntheticId, tag: Tag) => void

  selectedNode: SyntheticId | null
  selectedNodeTag: Tag
  onSelectNode: (nodeId: SyntheticId, tag: Tag) => void

  visibleNodes: Set<SyntheticId>
  onToggleNodeVisibility: (nodeId: SyntheticId) => void
}

export const NodeStateContext = React.createContext<NodeState>({
  focusedNode: null,
  focusedNodeTag: 'open',
  onFocusNode() {},
  selectedNode: null,
  selectedNodeTag: 'open',
  onSelectNode() {},
  visibleNodes: new Set(),
  onToggleNodeVisibility() {},
})

export function useNode<T extends VNode = VNode>(nodeId: SyntheticId) {
  const vtree = useContext(VTreeContext)

  if (!vtree) {
    return null
  }

  return (vtree.nodes[nodeId] as T) || null
}

export function useNodeVisibility(nodeId: SyntheticId) {
  const { visibleNodes, onToggleNodeVisibility } = useContext(NodeStateContext)

  return {
    isVisible: visibleNodes.has(nodeId),
    onToggleNodeVisibility: () => onToggleNodeVisibility(nodeId),
  }
}

export function useNodeState(nodeId: SyntheticId, tag: Tag) {
  const {
    focusedNode,
    focusedNodeTag,
    selectedNode,
    selectedNodeTag,
    onFocusNode,
    onSelectNode,
    visibleNodes,
    onToggleNodeVisibility,
  } = useContext(NodeStateContext)

  return {
    isFocused: focusedNode === nodeId && focusedNodeTag === tag,
    onFocusNode: useCallback(
      (tag: Tag = 'open') => onFocusNode(nodeId, tag),
      [onFocusNode, nodeId]
    ),
    isSelected: selectedNode === nodeId && selectedNodeTag === tag,
    onSelectNode: useCallback(
      (tag: Tag = 'open') => onSelectNode(nodeId, tag),
      [onSelectNode, nodeId]
    ),
    isVisible: visibleNodes.has(nodeId),
    onToggleNodeVisibility: useCallback(
      () => onToggleNodeVisibility(nodeId),
      [onToggleNodeVisibility, nodeId]
    ),
  }
}
