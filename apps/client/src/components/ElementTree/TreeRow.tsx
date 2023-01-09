import { Block } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { colors } from '~/config/theme'
import { INDENT, FONT_SIZE } from './constants'
import { SyntheticId } from '@repro/domain'
import { Tag, useNodeState } from './context'

type Props = PropsWithChildren<{
  nodeId: SyntheticId
  depth: number
  disableFocus?: boolean
  tag?: Tag
}>

export const TreeRow: React.FC<Props> = ({
  children,
  depth,
  nodeId,
  disableFocus,
  tag = 'open',
}) => {
  const { isSelected, onFocusNode, onSelectNode } = useNodeState(nodeId, tag)

  return (
    <div data-tree-node={`${nodeId}~${tag}`}>
      <Block
        position="relative"
        paddingLeft={INDENT * (depth + 1)}
        backgroundColor={isSelected ? colors.blue['100'] : 'transparent'}
        hoverBackgroundColor={
          isSelected
            ? colors.blue['100']
            : !disableFocus
            ? colors.blue['50']
            : undefined
        }
        fontSize={FONT_SIZE}
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
