import { SyntheticId } from '@/types/common'
import { VElement } from '@/types/vdom'
import { isEmptyElementVNode } from '@/utils/vdom'
import { Block, Inline } from 'jsxstyle'
import React, { useContext } from 'react'
import colors from 'tailwindcss/colors'
import { FONT_SIZE, INDENT } from './constants'
import { useNode, useNodeState, VTreeContext } from './context'
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
  const [targetNodeId, isOpen, toggleNode] = useNodeState(nodeId)

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
      <TreeRow highlight={nodeId === targetNodeId} depth={depth}>
        {!isTopLevelNode && hasChildren && (
          <Toggle isOpen={isOpen} onClick={toggleNode} />
        )}

        <Inline>
          <Syntax>{`<`}</Syntax>
          <TagName>{node.tagName}</TagName>
          {Object.entries(node.attributes).map(([name, value]) => (
            <Attribute key={name} name={name} value={value} />
          ))}
          <Syntax>{`>`}</Syntax>
        </Inline>

        {!isEmptyElement && !isOpen && (
          <Inline>
            <Syntax>{`</`}</Syntax>
            <TagName>{node.tagName}</TagName>
            <Syntax>{`>`}</Syntax>
          </Inline>
        )}
      </TreeRow>

      {!isEmptyElement && isOpen && (
        <Block>
          {node.children.map(childId => (
            <NodeRenderer key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </Block>
      )}

      {!isEmptyElement && isOpen && (
        <TreeRow depth={depth}>
          <Syntax>{`</`}</Syntax>
          <TagName>{node.tagName}</TagName>
          <Syntax>{`>`}</Syntax>
        </TreeRow>
      )}
    </Block>
  )
}

const Syntax: React.FC = ({ children }) => (
  <Inline color={colors.blueGray['500']}>{children}</Inline>
)

const TagName: React.FC = ({ children }) => (
  <Inline color={colors.pink['700']}>{children}</Inline>
)

const Attribute: React.FC<{ name: string; value: string | null }> = ({
  name,
  value,
}) => (
  <Inline marginLeft={FONT_SIZE / 2}>
    <Inline color={colors.amber['700']}>{name}</Inline>

    {value && (
      <React.Fragment>
        <Syntax>{'="'}</Syntax>
        <Inline color={colors.indigo['700']}>{value}</Inline>
        <Syntax>{'"'}</Syntax>
      </React.Fragment>
    )}
  </Inline>
)
