import { SyntheticId, VTree } from '@repro/domain'
import { Block } from 'jsxstyle'
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Subscription, fromEvent } from 'rxjs'
import { TreeRenderer } from './TreeRenderer'
import { NodeState, NodeStateContext, Tag } from './context'

interface Props {
  vtree: VTree
  focusedNode: SyntheticId | null
  selectedNode: SyntheticId | null
  onFocusNode(nodeId: SyntheticId | null): void
  onSelectNode(nodeId: SyntheticId | null): void
  usingPicker: boolean
}

export const ElementTree: React.FC<Props> = ({
  vtree,
  focusedNode,
  selectedNode,
  onFocusNode,
  onSelectNode,
}) => {
  const containerRef = useRef() as MutableRefObject<HTMLDivElement>
  const activeRef = useRef(false)
  const [visibleNodes, setVisibleNodes] = useState(new Set<SyntheticId>())
  const [openNodes, setOpenNodes] = useState(new Set<SyntheticId>())
  const [focusedNodeTag, setFocusedNodeTag] = useState<Tag>('open')
  const [selectedNodeTag, setSelectedNodeTag] = useState<Tag>('open')

  useEffect(() => {
    const subscription = new Subscription()

    subscription.add(
      fromEvent<PointerEvent>(containerRef.current, 'pointerenter').subscribe(
        () => (activeRef.current = true)
      )
    )

    subscription.add(
      fromEvent<PointerEvent>(containerRef.current, 'pointerleave').subscribe(
        () => (activeRef.current = false)
      )
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [containerRef, activeRef])

  useEffect(() => {
    if (!activeRef.current) {
      setOpenNodes(openNodes => {
        const nextOpenNodes = new Set(openNodes)

        let nodeId = selectedNode

        while (nodeId) {
          const node = vtree.nodes[nodeId]

          if (!node) {
            break
          }

          nodeId = node.parentId

          if (nodeId) {
            nextOpenNodes.add(nodeId)
          }
        }

        return nextOpenNodes
      })
    }
  }, [activeRef, vtree, setOpenNodes, selectedNode])

  useEffect(() => {
    const nextVisibleNodes = new Set(openNodes)

    if (!activeRef.current) {
      let nodeId = focusedNode

      while (nodeId) {
        const node = vtree.nodes[nodeId]

        if (!node) {
          break
        }

        nodeId = node.parentId

        if (nodeId) {
          nextVisibleNodes.add(nodeId)
        }
      }
    }

    setVisibleNodes(nextVisibleNodes)
  }, [activeRef, vtree, focusedNode, openNodes, setVisibleNodes])

  useEffect(() => {
    let handle = null

    if (!activeRef.current) {
      handle = requestIdleCallback(() => {
        const treeRow = containerRef.current.querySelector(
          `[data-tree-node="${selectedNode}~open"]`
        )

        if (treeRow) {
          treeRow.scrollIntoView({
            block: 'center',
          })
        }
      })
    }

    return () => {
      if (handle != null) {
        cancelIdleCallback(handle)
      }
    }
  }, [containerRef, selectedNode])

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

  const nodeStateContext: NodeState = {
    focusedNode,
    focusedNodeTag,
    onFocusNode: (nodeId, tag) => {
      setFocusedNodeTag(tag)
      onFocusNode(nodeId)
    },
    selectedNode,
    selectedNodeTag,
    onSelectNode: (nodeId, tag) => {
      setSelectedNodeTag(tag)
      onSelectNode(nodeId)
    },
    visibleNodes,
    onToggleNodeVisibility: toggleNode,
  }

  return (
    <NodeStateContext.Provider value={nodeStateContext}>
      <Block
        paddingV={8}
        userSelect="none"
        props={{ onPointerLeave: () => onFocusNode(null), ref: containerRef }}
      >
        <TreeRenderer vtree={vtree} />
      </Block>
    </NodeStateContext.Provider>
  )
}
