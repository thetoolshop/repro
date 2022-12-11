import { Block } from 'jsxstyle'
import React from 'react'
import { getRendererForType } from './getRendererForType'

interface Props {
  data: any
}

export const JSONView: React.FC<Props> = ({ data }) => {
  return (
    <Block
      position="relative"
      fontFamily="monospace"
      fontSize={13}
      lineHeight={1.25}
    >
      {getRendererForType(data, 0)}
    </Block>
  )
}
