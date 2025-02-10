import { Block } from '@jsxstyle/react'
import React from 'react'
import { MAX_INT32 } from './constants'
import { Toolbar } from './Toolbar'
import { VisiblePane } from './VisiblePane'

export const Controller: React.FC = () => {
  return (
    <Block
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={MAX_INT32}
      pointerEvents="none"
    >
      <Toolbar />
      <VisiblePane />
    </Block>
  )
}
