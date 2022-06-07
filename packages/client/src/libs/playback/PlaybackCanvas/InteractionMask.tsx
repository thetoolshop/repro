import React from 'react'
import { Block } from 'jsxstyle'

export const InteractionMask: React.FC = () => (
  <Block
    position="absolute"
    top={0}
    left={0}
    bottom={0}
    right={0}
    overflow="hidden"
  />
)
