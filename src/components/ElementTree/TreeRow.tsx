import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { INDENT, FONT_SIZE } from './constants'

interface Props {
  depth: number
  highlight?: boolean
}

export const TreeRow: React.FC<Props> = ({ children, depth, highlight }) => (
  <Block
    position="relative"
    paddingLeft={INDENT * (depth + 1)}
    backgroundColor={highlight ? colors.blue['100'] : 'transparent'}
    fontSize={FONT_SIZE}
    fontFamily="monospace"
    lineHeight={1.5}
    cursor="default"
    wordBreak="break-word"
  >
    {children}
  </Block>
)
