import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { INDENT, FONT_SIZE } from './constants'
import { SyntheticId } from '@/types/common'
import { Tag, useNodeState } from './context'

interface Props {
  nodeId: SyntheticId
  depth: number
  disableFocus?: boolean
  tag?: Tag
}

export const TreeRow: React.FC<Props> = ({
  children,
  depth,
  nodeId,
  disableFocus,
  tag = 'open',
}) => {
  const { isFocused, isSelected, onFocusNode, onSelectNode } = useNodeState(
    nodeId,
    tag
  )

  let highlightColor = 'transparent'

  if (isSelected) {
    highlightColor = colors.blue['100'] as string
  } else if (isFocused && !disableFocus) {
    highlightColor = colors.blue['50'] as string
  }

  return (
    <div data-tree-node={`${nodeId}~${tag}`}>
      <Block
        position="relative"
        paddingLeft={INDENT * (depth + 1)}
        backgroundColor={highlightColor}
        fontSize={FONT_SIZE}
        fontFamily="monospace"
        lineHeight={1.5}
        cursor="default"
        wordBreak="break-word"
        props={{
          onClick: () => onSelectNode(tag),
          onPointerEnter: () => onFocusNode(tag),
        }}
      >
        {children}
      </Block>
    </div>
  )
}
