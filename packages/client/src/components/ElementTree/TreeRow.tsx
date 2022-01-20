import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { INDENT, FONT_SIZE } from './constants'
import { SyntheticId } from '@/types/common'
import { useNodeState } from './context'

interface Props {
  nodeId: SyntheticId
  depth: number
  highlight?: boolean
}

export const TreeRow: React.FC<Props> = ({
  children,
  depth,
  highlight,
  nodeId,
}) => {
  const [, selectNode] = useNodeState(nodeId)

  return (
    <Block
      position="relative"
      paddingLeft={INDENT * (depth + 1)}
      backgroundColor={highlight ? colors.blue['100'] : 'transparent'}
      hoverBackgroundColor={highlight ? colors.blue['100'] : colors.blue['50']}
      fontSize={FONT_SIZE}
      fontFamily="monospace"
      lineHeight={1.5}
      cursor="default"
      wordBreak="break-word"
      props={{
        onClick: selectNode,
      }}
    >
      {children}
    </Block>
  )
}
