import { Block } from 'jsxstyle'
import React from 'react'
import {
  ArrowDown as OpenedIcon,
  ArrowRight as ClosedIcon,
} from 'react-feather'
import { colors } from '@/config/theme'
import { setFocusedNode, useFocusedNode, useSnapshot } from '@/libs/playback'
import { SyntheticId } from '@/types/common'
import { NodeType } from '@/types/vdom'
import { useAtomValue } from '@/utils/state'
import { ElementNode } from './ElementNode'
import {
  $openNodes,
  $selectedNode,
  blurNode,
  focusNode,
  selectNode,
  toggleOpen,
  useFocusedNodeTag,
} from './state'
import { TextNode } from './TextNode'

interface Props {
  id: SyntheticId
  level: number
}

export const Node: React.FC<Props> = ({ id, level }) => {
  const openNodes = useAtomValue($openNodes)
  const selectedNode = useAtomValue($selectedNode)
  const focusedNode = useFocusedNode()
  const focusedTag = useFocusedNodeTag()
  const snapshot = useSnapshot()

  if (!snapshot) {
    return null
  }

  const node = snapshot.nodes[id]

  if (!node) {
    throw new Error(`Cound not find VNode with ID "${id}"`)
  }

  const isRootNode = snapshot.rootId === node.id
  const isNodeOpen = openNodes.includes(node.id)
  const isNodeFocused = focusedNode === node.id
  const isNodeSelected = selectedNode !== null && selectedNode[0] === node.id
  const selectedTag = selectedNode && selectedNode[1]

  if (node.type === NodeType.Text) {
    return (
      <NodeRow
        indent={level}
        focused={isNodeFocused}
        selected={isNodeSelected}
        onBlur={blurNode}
        onFocus={() => focusNode(node.id, 'open')}
        onSelect={() => selectNode(node.id, 'open')}
      >
        <TextNode key={node.id} node={node} />
      </NodeRow>
    )
  }

  if (isNodeOpen) {
    return (
      <React.Fragment>
        <NodeRow
          indent={level}
          focused={isNodeFocused && focusedTag === 'open'}
          selected={isNodeSelected && selectedTag === 'open'}
          onBlur={blurNode}
          onFocus={() => focusNode(node.id, 'open')}
          onSelect={() => selectNode(node.id, 'open')}
        >
          {!isRootNode && <Toggle nodeId={node.id} open={isNodeOpen} />}
          <ElementNode.OpeningTag node={node} />
        </NodeRow>

        {isNodeOpen
          ? node.children.map(childId => (
              <Node key={childId} id={childId} level={level + 1} />
            ))
          : null}

        <NodeRow
          indent={level}
          focused={isNodeFocused && focusedTag === 'close'}
          selected={isNodeSelected && selectedTag === 'close'}
          onBlur={blurNode}
          onFocus={() => focusNode(node.id, 'close')}
          onSelect={() => selectNode(node.id, 'close')}
        >
          <ElementNode.ClosingTag node={node} />
        </NodeRow>
      </React.Fragment>
    )
  }

  return (
    <NodeRow
      indent={level}
      focused={isNodeFocused}
      selected={isNodeSelected}
      onBlur={blurNode}
      onFocus={() => focusNode(node.id, 'open')}
      onSelect={() => selectNode(node.id, 'open')}
    >
      <Toggle nodeId={node.id} open={isNodeOpen} />
      <ElementNode.OpeningTag node={node} />
      <ElementNode.ClosingTag node={node} />
    </NodeRow>
  )
}

interface NodeRowProps {
  indent: number
  focused: boolean
  selected: boolean
  onBlur(): void
  onFocus(): void
  onSelect(): void
}

const NodeRow: React.FC<NodeRowProps> = props => {
  const { children, focused, indent, selected, onBlur, onFocus, onSelect } =
    props

  const focusedColor = colors.blueGray['50']
  const selectedColor = colors.blue['100']

  const backgroundColor = selected
    ? selectedColor
    : focused
    ? focusedColor
    : 'transparent'

  return (
    <Block
      backgroundColor={backgroundColor}
      paddingLeft={`${indent * 2 + 1}rem`}
      paddingV={3}
      position="relative"
      props={{
        onPointerDown: onSelect,
        onPointerEnter: onFocus,
        onPointerLeave: onBlur,
      }}
    >
      {children}
    </Block>
  )
}

interface ToggleProps {
  nodeId: SyntheticId
  open: boolean
}

const Toggle: React.FC<ToggleProps> = ({ nodeId, open }) => {
  const onToggle = (evt: React.MouseEvent<HTMLDivElement>) => {
    evt.stopPropagation()
    toggleOpen(nodeId, !open)
  }

  return (
    <Block
      position="absolute"
      transform="translateX(-150%)"
      props={{ onPointerDown: onToggle }}
    >
      {open ? <OpenedIcon size={12} /> : <ClosedIcon size={12} />}
    </Block>
  )
}
